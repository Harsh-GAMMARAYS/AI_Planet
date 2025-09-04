from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
from routers.auth import verify_token

router = APIRouter(prefix="/api/workflows", tags=["workflow-storage"])

# Simple in-memory workflow storage (replace with database in production)
workflows_db = {}

class WorkflowCreate(BaseModel):
    name: str
    description: str
    nodes: List[dict]
    edges: List[dict]
    node_configs: dict

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    nodes: Optional[List[dict]] = None
    edges: Optional[List[dict]] = None
    node_configs: Optional[dict] = None

class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: str
    nodes: List[dict]
    edges: List[dict]
    node_configs: dict
    user_id: str
    created_at: datetime
    updated_at: datetime

@router.post("/", response_model=WorkflowResponse)
async def create_workflow(workflow: WorkflowCreate, user_id: str = Depends(verify_token)):
    workflow_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    workflows_db[workflow_id] = {
        "id": workflow_id,
        "name": workflow.name,
        "description": workflow.description,
        "nodes": workflow.nodes,
        "edges": workflow.edges,
        "node_configs": workflow.node_configs,
        "user_id": user_id,
        "created_at": now,
        "updated_at": now
    }
    
    return WorkflowResponse(**workflows_db[workflow_id])

@router.get("/", response_model=List[WorkflowResponse])
async def get_user_workflows(user_id: str = Depends(verify_token)):
    user_workflows = [
        WorkflowResponse(**workflow) 
        for workflow in workflows_db.values() 
        if workflow["user_id"] == user_id
    ]
    return user_workflows

@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str, user_id: str = Depends(verify_token)):
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows_db[workflow_id]
    if workflow["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this workflow")
    
    return WorkflowResponse(**workflow)

@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(workflow_id: str, workflow_update: WorkflowUpdate, user_id: str = Depends(verify_token)):
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows_db[workflow_id]
    if workflow["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this workflow")
    
    # Update only provided fields
    update_data = workflow_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        workflow[key] = value
    
    workflow["updated_at"] = datetime.utcnow()
    
    return WorkflowResponse(**workflow)

@router.delete("/{workflow_id}")
async def delete_workflow(workflow_id: str, user_id: str = Depends(verify_token)):
    if workflow_id not in workflows_db:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    workflow = workflows_db[workflow_id]
    if workflow["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this workflow")
    
    del workflows_db[workflow_id]
    return {"message": "Workflow deleted successfully"}
