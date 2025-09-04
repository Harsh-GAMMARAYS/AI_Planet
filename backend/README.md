# AI Planet Backend

FastAPI backend for AI Planet workflow builder with PostgreSQL database and ChromaDB for embeddings.

## Features

- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Stack Management**: Create and manage AI workflow stacks
- **Workflow Persistence**: Save and load workflows with nodes and edges
- **Chat History**: Persistent chat sessions with context
- **Knowledge Base**: PDF upload and embedding storage
- **LLM Integration**: Google Gemini and OpenAI support
- **Web Search**: DuckDuckGo integration

## Prerequisites

- Python 3.10+
- Docker and Docker Compose
- PostgreSQL (via Docker)
- ChromaDB (via Docker)

## Quick Start

1. **Start the databases**:
```bash
docker-compose up -d postgres chromadb
```

2. **Setup environment**:
```bash
cp env.example .env
# Edit .env with your API keys
```

3. **Install dependencies**:
```bash
uv sync
```

4. **Setup database**:
```bash
python init_db.py
```

5. **Run the server**:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL="postgresql://ai_planet_user:ai_planet_password@localhost:5432/ai_planet"

# API Keys
GOOGLE_API_KEY=your_google_api_key
OPENAI_API_KEY=your_openai_api_key
SERPAPI_API_KEY=your_serpapi_key

# JWT
JWT_SECRET=your_jwt_secret

# ChromaDB
CHROMA_HOST=localhost
CHROMA_PORT=8001
```

## Database Schema

### Users
- Authentication and user management
- JWT tokens for session management

### Stacks
- Container for workflows and chats
- User ownership and organization

### Workflows
- AI workflow definitions
- Node configurations and connections
- Version history via events

### Chats
- Persistent chat sessions
- Context snapshots from workflows
- Message history with sources

### Events
- Audit trail for all actions
- Workflow versioning
- User activity tracking

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Stacks
- `POST /api/stacks/` - Create stack
- `GET /api/stacks/` - Get user stacks
- `GET /api/stacks/{id}` - Get specific stack

### Workflows
- `POST /api/stacks/{stack_id}/workflows` - Create workflow
- `PUT /api/stacks/{stack_id}/workflows/{id}` - Update workflow

### Chat
- `POST /api/stacks/{stack_id}/chats` - Create chat session
- `POST /api/chat` - Send message to AI

### Knowledge Base
- `POST /api/upload-doc` - Upload PDF
- `POST /api/embed-doc` - Create embeddings
- `GET /api/search` - Search documents

## Development

### Database Setup
```bash
# Initialize database tables
python init_db.py

# Check database connection
curl http://localhost:8000/health
```

### Testing
```bash
# Health check
curl http://localhost:8000/health

# Test database connection
curl http://localhost:8000/api/ping
```

## Architecture

- **FastAPI**: Web framework with async support
- **SQLAlchemy**: Database ORM with PostgreSQL
- **PostgreSQL**: Primary database for metadata
- **ChromaDB**: Vector database for embeddings
- **JWT**: Stateless authentication
- **bcrypt**: Password hashing

## Production Deployment

1. Use environment-specific `.env` files
2. Set up proper PostgreSQL with backups
3. Configure CORS for your frontend domain
4. Use HTTPS in production
5. Set strong JWT secrets
6. Monitor with health checks

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL container is running
- Check DATABASE_URL format
- Verify network connectivity

### SQLAlchemy Issues
- Check database tables exist: `python init_db.py`
- Verify connection string format
- Check PostgreSQL logs

### API Key Issues
- Verify all required API keys are set
- Check key permissions and quotas
- Test with health endpoint
