## AI Planet – Workflow Builder

### Project Structure
```
backend/
  app/
    api/
    core/
    models/
    schemas/
    services/
    main.py
  requirements.txt
  Dockerfile
frontend/
  README.md
infra/
scripts/
```

### Requirements
- Docker + Docker Compose (recommended)
- Or: Python 3.11, Node 18+

### Setup (Docker)
```
cp .env.example .env
# Fill in API keys

docker compose up --build
```
API: http://localhost:8000/healthz
ChromaDB: http://localhost:8001
Postgres: localhost:5432

### Setup (Local Dev)
Backend:
```
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --app-dir backend
```

### Design & Requirements
- Assignment PDF: `Full-Stack Engineering Internship Assignment.pdf`
- Figma: https://www.figma.com/design/RVtXQB4bzKSlHrtejIQqMH/Assignment--FullStack-Engineer?node-id=0-1&p=f&t=1Il3F94QsXB7xAoG-0
- See `instructs.md` for agent guidance and acceptance criteria

### Next Steps
- Scaffold backend routers for documents, embeddings, workflow run
- Initialize frontend with Vite + React + React Flow
- Add database models and migrations
