import os
import re
from typing import List, Dict, Any, Tuple
import logging
import google.generativeai as genai
from services.vector_service import get_collection, store_embedding, query_embedding

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SimpleHybridRAGService:
    def __init__(self):
        """Initialize the Simple Hybrid RAG Service using existing Google API and ChromaDB."""
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if self.google_api_key:
            genai.configure(api_key=self.google_api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            logger.info("✅ Google Gemini model initialized successfully")
        else:
            logger.warning("⚠️ No Google API key found, using mock responses")
            self.model = None
        
        # Initialize ChromaDB collection
        try:
            self.collection = get_collection()
            logger.info("✅ ChromaDB collection initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize ChromaDB: {e}")
            self.collection = None
    
    def _chunk_text(self, text: str) -> List[str]:
        """Split text into chunks for processing."""
        # Simple chunking by paragraphs and sentences
        paragraphs = text.split('\n\n')
        chunks = []
        
        for paragraph in paragraphs:
            if len(paragraph.strip()) > 50:  # Only keep substantial chunks
                # Further split long paragraphs
                if len(paragraph) > 500:
                    sentences = paragraph.split('. ')
                    current_chunk = ""
                    for sentence in sentences:
                        if len(current_chunk + sentence) < 400:
                            current_chunk += sentence + ". "
                        else:
                            if current_chunk:
                                chunks.append(current_chunk.strip())
                            current_chunk = sentence + ". "
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                else:
                    chunks.append(paragraph.strip())
        
        return chunks
    
    def _extract_relationships_simple(self, text: str) -> List[Tuple[str, str, str]]:
        """Extract simple relationships from text using pattern matching."""
        relationships = []
        
        # Simple patterns to extract relationships
        patterns = [
            r'(\w+)\s+(?:is|are)\s+(?:a|an)?\s*(\w+)',
            r'(\w+)\s+(?:has|have)\s+(\w+)',
            r'(\w+)\s+(?:uses|use)\s+(\w+)',
            r'(\w+)\s+(?:provides|provide)\s+(\w+)',
            r'(\w+)\s+(?:includes|include)\s+(\w+)',
            r'(\w+)\s+(?:supports|support)\s+(\w+)',
        ]
        
        for pattern in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entity1 = match.group(1).strip()
                entity2 = match.group(2).strip()
                relation = "RELATES_TO"
                
                if "has" in pattern or "have" in pattern:
                    relation = "HAS"
                elif "uses" in pattern or "use" in pattern:
                    relation = "USES"
                elif "provides" in pattern or "provide" in pattern:
                    relation = "PROVIDES"
                elif "includes" in pattern or "include" in pattern:
                    relation = "INCLUDES"
                elif "supports" in pattern or "support" in pattern:
                    relation = "SUPPORTS"
                elif "is" in pattern or "are" in pattern:
                    relation = "IS_A"
                
                if len(entity1) > 2 and len(entity2) > 2:  # Filter out short words
                    relationships.append((entity1, relation, entity2))
        
        return relationships
    
    def ingest_data(self, file_path: str) -> Dict[str, Any]:
        """Ingest data into vector store and create simple knowledge graph."""
        try:
            # Read the data file
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            # Chunk the text
            chunks = self._chunk_text(text)
            logger.info(f"Created {len(chunks)} chunks from the text")
            
            # Store in ChromaDB
            if self.collection:
                for i, chunk in enumerate(chunks):
                    store_embedding(
                        doc_id=f"chunk_{i}",
                        text=chunk,
                        metadata={"source": file_path, "chunk_id": i}
                    )
                logger.info("✅ Successfully stored chunks in ChromaDB")
            
            # Extract simple relationships
            all_relationships = []
            for chunk in chunks:
                relationships = self._extract_relationships_simple(chunk)
                all_relationships.extend(relationships)
            
            logger.info(f"✅ Extracted {len(all_relationships)} relationships")
            
            # Store relationships in memory (simple approach for demo)
            self.relationships = all_relationships
            
            return {
                "status": "success",
                "chunks_processed": len(chunks),
                "relationships_extracted": len(all_relationships),
                "message": "Data successfully ingested into vector store and relationships extracted"
            }
        
        except Exception as e:
            logger.error(f"Failed to ingest data: {e}")
            return {
                "status": "error",
                "message": f"Failed to ingest data: {str(e)}"
            }
    
    def _route_query(self, question: str) -> str:
        """Simple routing logic based on question patterns."""
        question_lower = question.lower()
        
        # Graph search indicators
        graph_keywords = [
            "how does", "relate", "relationship", "connection", "connected",
            "links", "associated", "depends", "uses", "has", "includes"
        ]
        
        # Vector search indicators  
        vector_keywords = [
            "what is", "define", "explain", "describe", "meaning",
            "overview", "summary", "about"
        ]
        
        # Check for graph search patterns
        for keyword in graph_keywords:
            if keyword in question_lower:
                return "graph"
        
        # Check for vector search patterns
        for keyword in vector_keywords:
            if keyword in question_lower:
                return "vector"
        
        # Default to vector search
        return "vector"
    
    def _vector_search(self, question: str) -> Dict[str, Any]:
        """Perform vector search using ChromaDB."""
        try:
            if not self.collection:
                return {"answer": "ChromaDB not available", "sources": []}
            
            # Query ChromaDB
            results = query_embedding(question, n_results=3)
            
            if not results or not results.get('documents'):
                return {"answer": "No relevant information found", "sources": []}
            
            # Combine retrieved documents
            context = "\n\n".join(results['documents'][0])
            
            if self.model:
                # Generate answer using Gemini
                prompt = f"""
Based on the following context, answer the question concisely and accurately:

Context:
{context}

Question: {question}

Answer:
"""
                response = self.model.generate_content(prompt)
                answer = response.text
            else:
                # Fallback response
                answer = f"Based on the available information: {context[:200]}..."
            
            sources = [{"source": "chromadb", "chunk_ids": results.get('ids', [[]])[0]}]
            
            return {"answer": answer, "sources": sources}
        
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return {"answer": f"Vector search error: {str(e)}", "sources": []}
    
    def _graph_search(self, question: str) -> Dict[str, Any]:
        """Perform simple graph search using extracted relationships."""
        try:
            if not hasattr(self, 'relationships'):
                return {"answer": "No relationships available", "sources": []}
            
            # Simple keyword matching in relationships
            question_words = set(question.lower().split())
            relevant_relationships = []
            
            for entity1, relation, entity2 in self.relationships:
                if (any(word in entity1.lower() for word in question_words) or 
                    any(word in entity2.lower() for word in question_words)):
                    relevant_relationships.append((entity1, relation, entity2))
            
            if not relevant_relationships:
                return {"answer": "No relevant relationships found", "sources": []}
            
            # Format the relationships into an answer
            relationship_text = "\n".join([
                f"• {entity1} {relation.replace('_', ' ').lower()} {entity2}"
                for entity1, relation, entity2 in relevant_relationships[:5]
            ])
            
            if self.model:
                # Generate answer using Gemini
                prompt = f"""
Based on the following relationships, answer the question:

Relationships:
{relationship_text}

Question: {question}

Provide a clear, concise answer based on these relationships:
"""
                response = self.model.generate_content(prompt)
                answer = response.text
            else:
                # Fallback response
                answer = f"Based on the relationships:\n{relationship_text}"
            
            sources = [{"source": "knowledge_graph", "relationships": len(relevant_relationships)}]
            
            return {"answer": answer, "sources": sources}
        
        except Exception as e:
            logger.error(f"Graph search failed: {e}")
            return {"answer": f"Graph search error: {str(e)}", "sources": []}
    
    def query(self, question: str) -> Dict[str, Any]:
        """Query the hybrid RAG system."""
        try:
            # Route the query
            search_method = self._route_query(question)
            logger.info(f"Routing query to: {search_method}")
            
            if search_method == "vector":
                result = self._vector_search(question)
            else:
                result = self._graph_search(question)
            
            return {
                "status": "success",
                "answer": result["answer"],
                "search_method": search_method,
                "sources": result["sources"]
            }
        
        except Exception as e:
            logger.error(f"Failed to query: {e}")
            return {
                "status": "error",
                "message": f"Failed to process query: {str(e)}"
            }

# Global instance - will be initialized lazily
simple_hybrid_rag_service = None

def get_simple_hybrid_rag_service():
    """Get or create the simple hybrid RAG service instance."""
    global simple_hybrid_rag_service
    if simple_hybrid_rag_service is None:
        simple_hybrid_rag_service = SimpleHybridRAGService()
    return simple_hybrid_rag_service
