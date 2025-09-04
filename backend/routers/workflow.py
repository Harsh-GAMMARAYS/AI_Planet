from fastapi import APIRouter, UploadFile, File, Form, Query
from pydantic import BaseModel
import fitz, uuid
from services import vector_service, llm_service
from typing import Optional

#create a router
router = APIRouter(prefix="/api", tags=["workflow"])

@router.get("/ping")
async def ping():
    return {"message": "Workflow router is working"}

@router.post("/upload-doc")
async def upload_doc(file: UploadFile = File(...)):
    """
    Accepts a PDF, extracts text with PyMuPDF, and returns a preview
    """ 

    #Read file into memory
    contents = await file.read()

    #open PDF from memory
    doc = fitz.open(stream=contents, filetype="pdf")

    text = ""
    for page in doc:
        text += page.get_text("text") + "\n"

    #Return first 500 chars as preview
    return {
        "filename" : file.filename,
        "preview" : text[:500],
        "length" : len(text)
    }
    
@router.post("/embed-doc")
async def embed_doc(file: UploadFile = File(...)):
    # Read file
    contents = await file.read()

    # Extract text
    doc = fitz.open(stream=contents, filetype="pdf")
    
    chunks = []
    for page_num, page in enumerate(doc, start=1):
        text = page.get_text("text").strip()
        if text:
            chunks.append((f"{uuid.uuid4()}", text, {"filename": file.filename, "page": page_num}))

    if not chunks:
        return {"status": "error", "message": "No text extracted from PDF."}

    # Store all chunks in vector DB
    for doc_id, text, metadata in chunks:
        vector_service.store_embedding(doc_id, text, metadata=metadata)

    return {
        "status": "embedded",
        "filename": file.filename,
        "pages": len(chunks),
        "total_chars": sum(len(t) for _, t, _ in chunks)
    }

@router.get("/search")
async def search_docs(query: str, n_results: int = 3):
    results = vector_service.query_embedding(query, n_results=n_results)
    
    return {
        "query": query,
        "results": results
    }

# Pydantic models for request bodies
class WorkflowRequest(BaseModel):
    user_query: str
    use_knowledge_base: bool = False
    use_web_search: bool = False
    custom_prompt: Optional[str] = None

class WorkflowContext(BaseModel):
    user_query: Optional[str] = None
    custom_prompt: Optional[str] = None
    output_data: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    use_knowledge_base: bool = True
    use_web_search: bool = False
    workflow_context: Optional[WorkflowContext] = None

@router.post("/run-workflow")
async def run_workflow(request: WorkflowRequest):
    """
    Execute a complete AI workflow: Query -> (KnowledgeBase) -> (WebSearch) -> LLM -> Output
    """
    print(f"🚀 Workflow Request Received:")
    print(f"   Query: {request.user_query}")
    print(f"   Use KB: {request.use_knowledge_base}")
    print(f"   Use Web Search: {request.use_web_search}")
    print(f"   Custom Prompt: {request.custom_prompt}")
    
    result = await llm_service.process_workflow(
        user_query=request.user_query,
        use_knowledge_base=request.use_knowledge_base,
        use_web_search=request.use_web_search,
        custom_prompt=request.custom_prompt
    )
    
    print(f"✅ Workflow Result: {result}")
    return result

@router.post("/chat")
async def chat_with_stack(request: ChatRequest):
    """
    Chat interface that uses the knowledge base and optionally web search
    """
    # Build enhanced context if workflow context is provided
    enhanced_message = request.message
    
    if request.workflow_context:
        context_parts = []
        
        if request.workflow_context.user_query:
            context_parts.append(f"Original workflow query: {request.workflow_context.user_query}")
        
        if request.workflow_context.output_data:
            context_parts.append(f"Previous workflow output:\n{request.workflow_context.output_data}")
        
        if request.workflow_context.custom_prompt:
            context_parts.append(f"System prompt: {request.workflow_context.custom_prompt}")
        
        if context_parts:
            enhanced_message = f"Context from previous workflow:\n" + "\n".join(context_parts) + f"\n\nCurrent user message: {request.message}"
    
    result = await llm_service.process_workflow(
        user_query=enhanced_message,
        use_knowledge_base=request.use_knowledge_base,
        use_web_search=request.use_web_search,
        custom_prompt=request.workflow_context.custom_prompt if request.workflow_context else None
    )
    
    return {
        "message": request.message,
        "response": result["response"],
        "sources_used": {
            "knowledge_base": result["used_knowledge_base"],
            "web_search": result["used_web_search"]
        }
    }

@router.get("/web-search")
async def web_search(query: str, num_results: int = 5):
    """
    Direct web search endpoint using DuckDuckGo
    """
    results = await llm_service.search_web(query, num_results)
    
    return {
        "query": query,
        "results": results
    }
