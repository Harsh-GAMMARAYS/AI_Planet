from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hybrid-rag", tags=["Hybrid RAG"])

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

@router.post("/ingest", response_model=IngestResponse)
async def ingest_data():
    """
    Ingest data into ChromaDB and extract simple relationships.
    This endpoint processes the predefined dataset.
    """
    try:
        logger.info("Starting data ingestion...")
        
        # Import the service here to avoid circular imports
        from services.hybrid_rag_simple import get_simple_hybrid_rag_service
        service = get_simple_hybrid_rag_service()
        
        # Path to the data file
        data_file = Path(__file__).parent.parent / "data.txt"
        
        if not data_file.exists():
            raise HTTPException(
                status_code=404,
                detail=f"Data file not found: {data_file}"
            )
        
        # Ingest the data
        result = service.ingest_data(str(data_file))
        
        if result["status"] == "success":
            logger.info("✅ Data ingestion completed successfully")
            return IngestResponse(
                status="success",
                message=result["message"],
                chunks_processed=result["chunks_processed"],
                relationships_extracted=result["relationships_extracted"]
            )
        else:
            logger.error(f"❌ Data ingestion failed: {result['message']}")
            raise HTTPException(
                status_code=500,
                detail=result["message"]
            )
    
    except Exception as e:
        logger.error(f"❌ Unexpected error during ingestion: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest data: {str(e)}"
        )

@router.post("/query", response_model=QueryResponse)
async def query_hybrid_rag(request: QueryRequest):
    """
    Query the hybrid RAG system.
    The system will automatically route the query to either vector search or graph search
    based on the question type.
    """
    try:
        logger.info(f"Processing query: {request.question}")
        
        # Import the service here to avoid circular imports
        from services.hybrid_rag_simple import get_simple_hybrid_rag_service
        service = get_simple_hybrid_rag_service()
        
        # Query the hybrid RAG system
        result = service.query(request.question)
        
        if result["status"] == "success":
            logger.info(f"✅ Query processed successfully using {result['search_method']} search")
            return QueryResponse(
                status="success",
                answer=result["answer"],
                search_method=result["search_method"],
                sources=result["sources"]
            )
        else:
            logger.error(f"❌ Query processing failed: {result['message']}")
            raise HTTPException(
                status_code=500,
                detail=result["message"]
            )
    
    except Exception as e:
        logger.error(f"❌ Unexpected error during query processing: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process query: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for the hybrid RAG system.
    Checks the status of ChromaDB and Google API.
    """
    try:
        # Import the service here to avoid circular imports
        from services.hybrid_rag_simple import get_simple_hybrid_rag_service
        service = get_simple_hybrid_rag_service()
        
        health_status = {
            "status": "healthy",
            "components": {
                "chromadb": "connected" if service.collection else "disconnected",
                "google_api": "available" if service.model else "not_available"
            }
        }
        
        return health_status
    
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Health check failed: {str(e)}"
        )
