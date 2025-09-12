# Weaver Micro-PoC: Hybrid RAG and Knowledge Graph Engine

A modular, hybrid RAG (Retrieval-Augmented Generation) and Knowledge Graph engine that intelligently chooses between semantic search and graph-based reasoning using the Qwen2-0.5B model.

## Overview

This system demonstrates that a lightweight LLM can power a hybrid retrieval system that automatically routes queries to either:
- **Vector Search**: For definitions, explanations, and "what is" questions
- **Graph Search**: For relationships, connections, and "how does X relate to Y" questions

## Architecture

- **LLM**: Qwen2-0.5B-Instruct (with fallback to OpenAI/Google Gemini)
- **Framework**: LangChain + FastAPI
- **Vector Store**: ChromaDB
- **Graph Database**: Neo4j
- **Deployment**: Docker & Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose
- At least 4GB RAM available for containers
- Optional: OpenAI API key or Google API key for fallback LLM

### 1. Clone and Setup
```bash
cd /home/gamma/AI_Planet
```

### 2. Environment Variables (Optional)
Create a `.env` file in the backend directory:
```bash
# Optional: For fallback LLM if Qwen2-0.5B fails to load
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here

# Database configurations (already set in docker-compose.yml)
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=ai_planet_password
CHROMA_HOST=chromadb
CHROMA_PORT=8001
```

### 3. Launch the Application Stack
```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** (port 5432): Metadata storage
- **ChromaDB** (port 8001): Vector embeddings
- **Neo4j** (port 7474/7687): Knowledge graph
- **FastAPI API** (port 8000): Main application

### 4. Wait for Initialization
The first startup may take 5-10 minutes as it downloads the Qwen2-0.5B model (~1GB). Monitor logs:
```bash
docker-compose logs -f api
```

## API Endpoints

### Health Check
```bash
curl -X GET "http://localhost:8000/hybrid-rag/health"
```

### Data Ingestion
Ingest the predefined FastAPI dataset into both vector store and knowledge graph:
```bash
curl -X POST "http://localhost:8000/hybrid-rag/ingest" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Data successfully ingested into both vector store and knowledge graph",
  "chunks_processed": 6,
  "triples_extracted": 15
}
```

### Query the Hybrid System

#### Vector Search Example (Definitions/Explanations)
```bash
curl -X POST "http://localhost:8000/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is FastAPI?"
  }'
```

#### Graph Search Example (Relationships)
```bash
curl -X POST "http://localhost:8000/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "How does FastAPI relate to Pydantic?"
  }'
```

#### More Query Examples
```bash
# Vector search queries
curl -X POST "http://localhost:8000/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the core components of FastAPI?"}'

curl -X POST "http://localhost:8000/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "Explain middleware in FastAPI"}'

# Graph search queries
curl -X POST "http://localhost:8000/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What parameters does the GET method accept?"}'

curl -X POST "http://localhost:8000/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "How are routers connected to the main application?"}'
```

**Expected Response Format:**
```json
{
  "status": "success",
  "answer": "FastAPI is a modern, fast web framework for building APIs with Python 3.7+...",
  "search_method": "vector",
  "sources": [
    {"source": "data.txt", "chunk_id": 0}
  ]
}
```

## How It Works

### 1. Data Ingestion Pipeline
1. **Text Chunking**: Splits documents into 300-character chunks with 50-character overlap
2. **Vector Storage**: Generates embeddings using `sentence-transformers/all-MiniLM-L6-v2` and stores in ChromaDB
3. **Knowledge Graph Creation**: 
   - Uses Qwen2-0.5B to extract (Entity, Relationship, Entity) triples
   - Stores triples as nodes and relationships in Neo4j

### 2. Query Routing
The system uses an LLM-powered router with this prompt:
```
Given the user's question, determine if it is better answered by:
(A) Vector Search: For questions about definitions, explanations, or 'what is' questions.
(B) Graph Query: For questions about relationships, connections, or 'how does X relate to Y' questions.
```

### 3. Retrieval Methods
- **Vector Search**: Uses ChromaDB similarity search + RetrievalQA chain
- **Graph Search**: Converts natural language to Cypher queries + GraphCypherQAChain

## Web Interface Access

- **Neo4j Browser**: http://localhost:7474
  - Username: `neo4j`
  - Password: `ai_planet_password`

- **API Documentation**: http://localhost:8000/docs

## Troubleshooting

### Model Loading Issues
If Qwen2-0.5B fails to load (common on systems with <8GB RAM):
1. Add OpenAI or Google API key to `.env` file
2. The system will automatically fall back to cloud APIs

### Container Issues
```bash
# Check container status
docker-compose ps

# View logs
docker-compose logs api
docker-compose logs neo4j
docker-compose logs chromadb

# Restart services
docker-compose restart
```

### Database Connection Issues
```bash
# Reset all data
docker-compose down -v
docker-compose up --build
```

## Development

### Run Ingestion Script Manually
```bash
cd backend
python ingestion.py
```

### Test Individual Components
```bash
# Test vector search only
python -c "
from services.hybrid_rag_service import hybrid_rag_service
result = hybrid_rag_service.vector_chain.invoke({'query': 'What is FastAPI?'})
print(result)
"

# Test graph search only
python -c "
from services.hybrid_rag_service import hybrid_rag_service
result = hybrid_rag_service.graph_chain.invoke({'query': 'What components does FastAPI have?'})
print(result)
"
```

## System Requirements

- **RAM**: 8GB recommended (4GB minimum with cloud LLM fallback)
- **Storage**: 2GB for Docker images and models
- **CPU**: Multi-core recommended for model inference

## Performance Notes

- First query may take 30-60 seconds due to model warm-up
- Subsequent queries typically respond in 2-10 seconds
- Vector search is generally faster than graph search
- Graph search provides more structured, relationship-based answers

## What's Included vs. Excluded

### ✅ Included
- Complete hybrid RAG system with automatic routing
- Docker containerization with all dependencies
- REST API with comprehensive endpoints
- Fallback mechanisms for model loading
- Health checks and error handling
- Comprehensive documentation

### ❌ Excluded (Out of Scope for 2-Day PoC)
- User interface (UI)
- Advanced error handling and input validation
- Asynchronous background tasks for ingestion
- Scalability optimizations
- Extensive prompt engineering
- Authentication/authorization
- Production-grade logging and monitoring

## Next Steps

To extend this PoC:
1. Add a React frontend for the workflow builder integration
2. Implement background task processing for large document ingestion
3. Add more sophisticated prompt engineering for better entity extraction
4. Implement caching for frequently asked questions
5. Add support for multiple document formats (PDF, Word, etc.)
6. Implement user authentication and multi-tenancy

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs`
3. Ensure all prerequisites are met
4. Verify API endpoints with the provided curl examples
