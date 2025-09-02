from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import workflow
from dotenv import load_dotenv
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

@app.get("/")
async def root():
    return {"message": "Backend is running 🚀"}
