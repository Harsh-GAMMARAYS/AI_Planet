#!/usr/bin/env python3
"""
Standalone Hybrid RAG System
A simple FastAPI app that demonstrates hybrid RAG without heavy dependencies.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any
import os
import re
import logging
from pathlib import Path
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Hybrid RAG Demo", description="A simple hybrid RAG system demo")

# Request/Response models
class QueryRequest(BaseModel):
    question: str

class QueryResponse(BaseModel):
    status: str
    answer: str
    search_method: str
    sources: list

class IngestResponse(BaseModel):
    status: str
    message: str
    chunks_processed: int = 0
    relationships_extracted: int = 0

# Simple in-memory storage
chunks_store = []
relationships_store = []

class SimpleHybridRAG:
    def __init__(self):
        """Initialize with Google API if available."""
        self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if self.google_api_key:
            genai.configure(api_key=self.google_api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            logger.info("✅ Google Gemini model initialized")
        else:
            logger.warning("⚠️ No Google API key found, using fallback responses")
            self.model = None
    
    def chunk_text(self, text: str) -> List[str]:
        """Split text into chunks."""
        paragraphs = text.split('\n\n')
        chunks = []
        
        for paragraph in paragraphs:
            if len(paragraph.strip()) > 50:
                if len(paragraph) > 400:
                    sentences = paragraph.split('. ')
                    current_chunk = ""
                    for sentence in sentences:
                        if len(current_chunk + sentence) < 350:
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
    
    def extract_relationships(self, text: str) -> List[tuple]:
        """Extract simple relationships using pattern matching."""
        relationships = []
        
        # Simple patterns
        patterns = [
            (r'(\w+)\s+(?:is|are)\s+(?:a|an)?\s*(\w+)', "IS_A"),
            (r'(\w+)\s+(?:has|have)\s+(\w+)', "HAS"),
            (r'(\w+)\s+(?:uses|use)\s+(\w+)', "USES"),
            (r'(\w+)\s+(?:provides|provide)\s+(\w+)', "PROVIDES"),
            (r'(\w+)\s+(?:includes|include)\s+(\w+)', "INCLUDES"),
            (r'(\w+)\s+(?:supports|support)\s+(\w+)', "SUPPORTS"),
        ]
        
        for pattern, relation in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                entity1 = match.group(1).strip()
                entity2 = match.group(2).strip()
                if len(entity1) > 2 and len(entity2) > 2:
                    relationships.append((entity1, relation, entity2))
        
        return relationships
    
    def route_query(self, question: str) -> str:
        """Route query to vector or graph search."""
        question_lower = question.lower()
        
        graph_keywords = ["how does", "relate", "relationship", "connection", "uses", "has"]
        vector_keywords = ["what is", "define", "explain", "describe", "about"]
        
        for keyword in graph_keywords:
            if keyword in question_lower:
                return "graph"
        
        for keyword in vector_keywords:
            if keyword in question_lower:
                return "vector"
        
        return "vector"
    
    def vector_search(self, question: str) -> Dict[str, Any]:
        """Simple vector search using keyword matching."""
        if not chunks_store:
            return {"answer": "No data ingested yet", "sources": []}
        
        # Simple keyword matching
        question_words = set(question.lower().split())
        scored_chunks = []
        
        for i, chunk in enumerate(chunks_store):
            chunk_words = set(chunk.lower().split())
            score = len(question_words.intersection(chunk_words))
            if score > 0:
                scored_chunks.append((score, chunk, i))
        
        if not scored_chunks:
            return {"answer": "No relevant information found", "sources": []}
        
        # Get top chunks
        scored_chunks.sort(reverse=True)
        top_chunks = [chunk for _, chunk, _ in scored_chunks[:3]]
        context = "\n\n".join(top_chunks)
        
        if self.model:
            try:
                prompt = f"""
Based on the following context, answer the question concisely:

Context:
{context}

Question: {question}

Answer:
"""
                response = self.model.generate_content(prompt)
                answer = response.text
            except Exception as e:
                answer = f"Error generating response: {str(e)}"
        else:
            answer = f"Based on the available information: {context[:300]}..."
        
        return {"answer": answer, "sources": [{"type": "vector", "chunks": len(top_chunks)}]}
    
    def graph_search(self, question: str) -> Dict[str, Any]:
        """Simple graph search using relationships."""
        if not relationships_store:
            return {"answer": "No relationships available", "sources": []}
        
        question_words = set(question.lower().split())
        relevant_relationships = []
        
        for entity1, relation, entity2 in relationships_store:
            if (any(word in entity1.lower() for word in question_words) or 
                any(word in entity2.lower() for word in question_words)):
                relevant_relationships.append((entity1, relation, entity2))
        
        if not relevant_relationships:
            return {"answer": "No relevant relationships found", "sources": []}
        
        relationship_text = "\n".join([
            f"• {entity1} {relation.replace('_', ' ').lower()} {entity2}"
            for entity1, relation, entity2 in relevant_relationships[:5]
        ])
        
        if self.model:
            try:
                prompt = f"""
Based on these relationships, answer the question:

Relationships:
{relationship_text}

Question: {question}

Answer:
"""
                response = self.model.generate_content(prompt)
                answer = response.text
            except Exception as e:
                answer = f"Error generating response: {str(e)}"
        else:
            answer = f"Based on the relationships:\n{relationship_text}"
        
        return {"answer": answer, "sources": [{"type": "graph", "relationships": len(relevant_relationships)}]}

# Initialize the service
rag_service = SimpleHybridRAG()

@app.get("/")
async def root():
    return {"message": "Hybrid RAG Demo is running! 🚀"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "google_api": "available" if rag_service.model else "not_available",
        "data_ingested": len(chunks_store) > 0
    }

@app.post("/ingest", response_model=IngestResponse)
async def ingest_data():
    """Ingest the sample data."""
    try:
        # Path to data file
        data_file = Path(__file__).parent / "data.txt"
        
        if not data_file.exists():
            raise HTTPException(status_code=404, detail="Data file not found")
        
        # Read and process data
        with open(data_file, 'r', encoding='utf-8') as f:
            text = f.read()
        
        # Clear existing data
        chunks_store.clear()
        relationships_store.clear()
        
        # Process chunks
        chunks = rag_service.chunk_text(text)
        chunks_store.extend(chunks)
        
        # Extract relationships
        for chunk in chunks:
            relationships = rag_service.extract_relationships(chunk)
            relationships_store.extend(relationships)
        
        logger.info(f"✅ Ingested {len(chunks)} chunks and {len(relationships_store)} relationships")
        
        return IngestResponse(
            status="success",
            message="Data ingested successfully",
            chunks_processed=len(chunks),
            relationships_extracted=len(relationships_store)
        )
    
    except Exception as e:
        logger.error(f"❌ Ingestion failed: {e}")
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

@app.post("/query", response_model=QueryResponse)
async def query_rag(request: QueryRequest):
    """Query the hybrid RAG system."""
    try:
        if not chunks_store:
            raise HTTPException(status_code=400, detail="No data ingested. Please call /ingest first.")
        
        # Route the query
        search_method = rag_service.route_query(request.question)
        logger.info(f"Routing query '{request.question}' to {search_method} search")
        
        # Execute search
        if search_method == "vector":
            result = rag_service.vector_search(request.question)
        else:
            result = rag_service.graph_search(request.question)
        
        return QueryResponse(
            status="success",
            answer=result["answer"],
            search_method=search_method,
            sources=result["sources"]
        )
    
    except Exception as e:
        logger.error(f"❌ Query failed: {e}")
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Hybrid RAG Demo Server...")
    print("📋 Available endpoints:")
    print("  • GET  /health - Health check")
    print("  • POST /ingest - Ingest sample data")
    print("  • POST /query - Query the system")
    print("  • GET  /docs - API documentation")
    print("")
    uvicorn.run(app, host="0.0.0.0", port=8000)
