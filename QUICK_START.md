# 🚀 Quick Start Guide: Hybrid RAG System

## One-Command Deployment

```bash
cd /home/gamma/AI_Planet
./deploy_hybrid_rag.sh
```

This script will:
1. ✅ Check prerequisites (Docker, Docker Compose)
2. 🧹 Clean up existing containers
3. 🏗️ Build and start all services
4. ⏳ Wait for initialization (5-10 minutes)
5. 🧪 Test all endpoints
6. 📋 Display access information

## Manual Deployment (Alternative)

### 1. Start Services
```bash
cd /home/gamma/AI_Planet
docker compose up --build -d
```

### 2. Wait for Initialization
```bash
# Check logs (wait for "model initialized successfully")
docker compose logs -f api
```

### 3. Ingest Data
```bash
curl -X POST "http://localhost:8000/hybrid-rag/ingest" \
  -H "Content-Type: application/json"
```

### 4. Test Queries
```bash
# Vector search (definitions)
curl -X POST "http://localhost:8000/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is FastAPI?"}'

# Graph search (relationships)
curl -X POST "http://localhost:8000/hybrid-rag/query" \
  -H "Content-Type: application/json" \
  -d '{"question": "How does FastAPI relate to Pydantic?"}'
```

## Access Points

| Service | URL | Credentials |
|---------|-----|-------------|
| API Documentation | http://localhost:8000/docs | None |
| Neo4j Browser | http://localhost:7474 | neo4j/ai_planet_password |
| ChromaDB | http://localhost:8001 | None |

## System Requirements

- **RAM**: 8GB recommended (4GB minimum with API fallback)
- **Storage**: 2GB for containers and models
- **Ports**: 5432, 7474, 7687, 8000, 8001

## Troubleshooting

### Model Loading Issues
If you see "Failed to initialize Qwen2-0.5B model":
1. Add API key to `.env` file:
   ```bash
   cp backend/env.example backend/.env
   # Edit backend/.env with your OPENAI_API_KEY or GOOGLE_API_KEY
   ```
2. Restart: `docker compose restart api`

### Service Issues
```bash
# Check status
docker compose ps

# View logs
docker compose logs api
docker compose logs neo4j
docker compose logs chromadb

# Restart all
docker compose restart

# Reset everything
docker compose down -v
docker compose up --build -d
```

## What's Running

1. **PostgreSQL** (port 5432): Metadata storage
2. **ChromaDB** (port 8001): Vector embeddings
3. **Neo4j** (port 7474/7687): Knowledge graph
4. **FastAPI** (port 8000): Hybrid RAG API

## Next Steps

- View complete documentation: `HYBRID_RAG_README.md`
- Explore API: http://localhost:8000/docs
- Browse knowledge graph: http://localhost:7474
- Run comprehensive tests: `./test_hybrid_rag.sh`
