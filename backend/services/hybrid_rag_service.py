import os
import re
from typing import List, Dict, Any, Tuple
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.llms import HuggingFacePipeline
from langchain.chains import RetrievalQA
from langchain_community.graphs import Neo4jGraph
from langchain.chains import GraphCypherQAChain
from langchain.prompts import PromptTemplate
import chromadb
from neo4j import GraphDatabase
import logging
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HybridRAGService:
    def __init__(self):
        """Initialize the Hybrid RAG Service with ChromaDB, Neo4j, and Qwen2-0.5B model."""
        self.chroma_host = os.getenv("CHROMA_HOST", "localhost")
        self.chroma_port = int(os.getenv("CHROMA_PORT", "8001"))
        self.neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.neo4j_user = os.getenv("NEO4J_USER", "neo4j")
        self.neo4j_password = os.getenv("NEO4J_PASSWORD", "ai_planet_password")
        
        # Initialize components
        self.embeddings = None
        self.vectorstore = None
        self.graph = None
        self.llm = None
        self.vector_chain = None
        self.graph_chain = None
        self.router_chain = None
        
        # Initialize all components
        self._initialize_embeddings()
        self._initialize_vectorstore()
        self._initialize_graph()
        self._initialize_llm()
        self._initialize_chains()
    
    def _initialize_embeddings(self):
        """Initialize HuggingFace embeddings."""
        try:
            self.embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2"
            )
            logger.info("✅ Embeddings initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize embeddings: {e}")
            raise
    
    def _initialize_vectorstore(self):
        """Initialize ChromaDB connection."""
        try:
            # Create ChromaDB client
            chroma_client = chromadb.HttpClient(
                host=self.chroma_host,
                port=self.chroma_port
            )
            
            # Initialize Langchain ChromaDB wrapper
            self.vectorstore = Chroma(
                client=chroma_client,
                collection_name="hybrid_rag_collection",
                embedding_function=self.embeddings
            )
            logger.info("✅ ChromaDB vectorstore initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize ChromaDB: {e}")
            raise
    
    def _initialize_graph(self):
        """Initialize Neo4j graph connection."""
        try:
            self.graph = Neo4jGraph(
                url=self.neo4j_uri,
                username=self.neo4j_user,
                password=self.neo4j_password
            )
            logger.info("✅ Neo4j graph initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Neo4j: {e}")
            raise
    
    def _initialize_llm(self):
        """Initialize Qwen2-0.5B model."""
        try:
            model_name = "Qwen/Qwen2-0.5B-Instruct"
            
            # Load tokenizer and model
            tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
                
            model = AutoModelForCausalLM.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None,
                trust_remote_code=True
            )
            
            # Create pipeline
            pipe = pipeline(
                "text-generation",
                model=model,
                tokenizer=tokenizer,
                max_new_tokens=256,
                temperature=0.1,
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                return_full_text=False
            )
            
            # Create LangChain wrapper
            self.llm = HuggingFacePipeline(pipeline=pipe)
            logger.info("✅ Qwen2-0.5B model initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Qwen2-0.5B model: {e}")
            # Fallback to a simpler approach if model loading fails
            logger.info("Using fallback LLM implementation")
            self._initialize_fallback_llm()
    
    def _initialize_fallback_llm(self):
        """Initialize a fallback LLM using OpenAI or Google Gemini."""
        try:
            # Try OpenAI first
            openai_key = os.getenv("OPENAI_API_KEY")
            if openai_key:
                from langchain_openai import OpenAI
                self.llm = OpenAI(temperature=0.1, max_tokens=256)
                logger.info("✅ Using OpenAI as fallback LLM")
                return
            
            # Try Google Gemini
            google_key = os.getenv("GOOGLE_API_KEY")
            if google_key:
                from langchain_community.llms import GooglePalm
                self.llm = GooglePalm(temperature=0.1, max_output_tokens=256)
                logger.info("✅ Using Google Gemini as fallback LLM")
                return
            
            # If no API keys available, create a mock LLM for testing
            from langchain.llms.fake import FakeListLLM
            responses = [
                "Vector Search",
                "Graph Query", 
                "FastAPI has components like routers, middleware, and dependency injection.",
                "The get function accepts parameters like url, headers, and timeout.",
                "FastAPI provides automatic API documentation and validation."
            ]
            self.llm = FakeListLLM(responses=responses)
            logger.warning("⚠️ Using mock LLM - add OPENAI_API_KEY or GOOGLE_API_KEY for production")
            
        except Exception as e:
            logger.error(f"Failed to initialize fallback LLM: {e}")
            raise
    
    def _initialize_chains(self):
        """Initialize RAG chains."""
        try:
            # Vector RAG Chain
            self.vector_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=self.vectorstore.as_retriever(search_kwargs={"k": 3}),
                return_source_documents=True
            )
            
            # Graph RAG Chain with custom prompt
            cypher_prompt = PromptTemplate(
                input_variables=["schema", "question"],
                template="""
You are a Neo4j expert. Given an input question, create a syntactically correct Cypher query.

Schema: {schema}

Question: {question}

Only use the relationship types and properties that appear in the schema.
Do not use any other relationship types or properties.

Examples:
Question: What parameters does the get function accept?
Cypher: MATCH (f:Function {{name: "get"}})-[:ACCEPTS_PARAMETER]->(p:Parameter) RETURN p.name

Question: What components does FastAPI have?
Cypher: MATCH (f:Framework {{name: "FastAPI"}})-[:HAS_COMPONENT]->(c:Component) RETURN c.name

Cypher Query:
"""
            )
            
            self.graph_chain = GraphCypherQAChain.from_llm(
                llm=self.llm,
                graph=self.graph,
                cypher_prompt=cypher_prompt,
                verbose=True
            )
            
            logger.info("✅ RAG chains initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize RAG chains: {e}")
            raise
    
    def _chunk_text(self, text: str) -> List[str]:
        """Split text into chunks for processing."""
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=300,
            chunk_overlap=50,
            length_function=len
        )
        chunks = text_splitter.split_text(text)
        return chunks
    
    def _extract_entities_and_relationships(self, text: str) -> List[Tuple[str, str, str]]:
        """Extract entity-relationship triples from text using Qwen2-0.5B."""
        try:
            prompt = f"""
From the text below, extract relationships as triples (HEAD, RELATION, TAIL). 
Examples: (FastAPI, HAS_COMPONENT, routers), (routers, ENABLES, organization), (Pydantic, PROVIDES, validation).

Text: '{text}'

Extract only clear, factual relationships. Format as: (entity1, relationship, entity2)

Triples:
"""
            
            # Generate response using the LLM
            response = self.llm.invoke(prompt)
            
            # Parse the response to extract triples
            triples = []
            lines = response.split('\n')
            
            for line in lines:
                # Look for patterns like (entity1, relationship, entity2)
                match = re.search(r'\(([^,]+),\s*([^,]+),\s*([^)]+)\)', line)
                if match:
                    head = match.group(1).strip()
                    relation = match.group(2).strip()
                    tail = match.group(3).strip()
                    triples.append((head, relation, tail))
            
            return triples
        except Exception as e:
            logger.error(f"Failed to extract entities and relationships: {e}")
            return []
    
    def ingest_data(self, file_path: str) -> Dict[str, Any]:
        """Ingest data into both vector store and knowledge graph."""
        try:
            # Read the data file
            with open(file_path, 'r', encoding='utf-8') as file:
                text = file.read()
            
            # Chunk the text
            chunks = self._chunk_text(text)
            logger.info(f"Created {len(chunks)} chunks from the text")
            
            # Store in vector database
            self.vectorstore.add_texts(
                texts=chunks,
                metadatas=[{"source": file_path, "chunk_id": i} for i in range(len(chunks))]
            )
            logger.info("✅ Successfully stored chunks in ChromaDB")
            
            # Extract and store relationships in knowledge graph
            all_triples = []
            for i, chunk in enumerate(chunks):
                triples = self._extract_entities_and_relationships(chunk)
                all_triples.extend(triples)
                logger.info(f"Extracted {len(triples)} triples from chunk {i+1}")
            
            # Store triples in Neo4j
            self._store_triples_in_neo4j(all_triples)
            
            return {
                "status": "success",
                "chunks_processed": len(chunks),
                "triples_extracted": len(all_triples),
                "message": "Data successfully ingested into both vector store and knowledge graph"
            }
        
        except Exception as e:
            logger.error(f"Failed to ingest data: {e}")
            return {
                "status": "error",
                "message": f"Failed to ingest data: {str(e)}"
            }
    
    def _store_triples_in_neo4j(self, triples: List[Tuple[str, str, str]]):
        """Store entity-relationship triples in Neo4j."""
        try:
            with self.graph._driver.session() as session:
                for head, relation, tail in triples:
                    # Clean up entity and relationship names
                    head = head.replace('"', '').replace("'", "").strip()
                    tail = tail.replace('"', '').replace("'", "").strip()
                    relation = relation.replace('"', '').replace("'", "").replace(' ', '_').upper().strip()
                    
                    if head and tail and relation:
                        # Create nodes and relationship
                        query = f"""
                        MERGE (h:Entity {{name: $head}})
                        MERGE (t:Entity {{name: $tail}})
                        MERGE (h)-[r:{relation}]->(t)
                        """
                        session.run(query, head=head, tail=tail)
            
            logger.info(f"✅ Successfully stored {len(triples)} triples in Neo4j")
        except Exception as e:
            logger.error(f"Failed to store triples in Neo4j: {e}")
            raise
    
    def route_query(self, question: str) -> str:
        """Route the query to either vector search or graph search."""
        try:
            router_prompt = f"""
Given the user's question, determine if it is better answered by:
(A) Vector Search: For questions about definitions, explanations, or 'what is' questions.
(B) Graph Query: For questions about relationships, connections, or 'how does X relate to Y' questions.

Question: '{question}'

Best method is:
"""
            
            response = self.llm.invoke(router_prompt)
            
            # Simple routing logic based on response
            if "(A)" in response or "Vector Search" in response:
                return "vector"
            elif "(B)" in response or "Graph Query" in response:
                return "graph"
            else:
                # Default to vector search if unclear
                return "vector"
        
        except Exception as e:
            logger.error(f"Failed to route query: {e}")
            return "vector"  # Default fallback
    
    def query(self, question: str) -> Dict[str, Any]:
        """Query the hybrid RAG system."""
        try:
            # Route the query
            search_method = self.route_query(question)
            logger.info(f"Routing query to: {search_method}")
            
            if search_method == "vector":
                # Use vector search
                result = self.vector_chain.invoke({"query": question})
                answer = result.get("result", "No answer found")
                sources = [doc.metadata for doc in result.get("source_documents", [])]
            else:
                # Use graph search
                result = self.graph_chain.invoke({"query": question})
                answer = result.get("result", "No answer found")
                sources = [{"source": "knowledge_graph"}]
            
            return {
                "status": "success",
                "answer": answer,
                "search_method": search_method,
                "sources": sources
            }
        
        except Exception as e:
            logger.error(f"Failed to query: {e}")
            return {
                "status": "error",
                "message": f"Failed to process query: {str(e)}"
            }

# Global instance - will be initialized lazily
hybrid_rag_service = None

def get_hybrid_rag_service():
    """Get or create the hybrid RAG service instance."""
    global hybrid_rag_service
    if hybrid_rag_service is None:
        hybrid_rag_service = HybridRAGService()
    return hybrid_rag_service
