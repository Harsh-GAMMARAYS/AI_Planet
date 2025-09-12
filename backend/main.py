from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import workflow, auth, workflow_storage, stacks, hybrid_rag_simple
from dotenv import load_dotenv
from services.database import init_db
import os
load_dotenv()

print("GOOGLE_API_KEY loaded:", bool(os.getenv("GOOGLE_API_KEY")))

app = FastAPI(title="AI Workflow Backend")

# Enable CORS so frontend (Vite + React) can call APIs
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # in prod: replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(workflow.router)
app.include_router(auth.router)
app.include_router(workflow_storage.router)
app.include_router(stacks.router)
app.include_router(hybrid_rag_simple.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    init_db()
    print("✅ Database initialized")

@app.get("/")
async def root():
    return {"message": "Backend is running 🚀"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    api_key = os.getenv("GOOGLE_API_KEY")
    return {
        "status": "healthy",
        "database": "initialized",
        "google_api": bool(api_key and api_key != "your_google_api_key_here")
    }
