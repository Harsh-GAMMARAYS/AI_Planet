from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from routers.auth import verify_token
from services.database import db
import json

router = APIRouter(prefix="/api/stacks", tags=["stacks"])

class StackCreate(BaseModel):
    name: str
    description: Optional[str] = None

class StackResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    created_at: str
    updated_at: str

class WorkflowCreate(BaseModel):
    name: str
    description: Optional[str] = None
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    node_configs: Optional[Dict[str, Any]] = None

class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    node_configs: Optional[Dict[str, Any]]
    created_at: str
    updated_at: str

class ChatCreate(BaseModel):
    title: Optional[str] = None
    context_snapshot: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    id: str
    title: Optional[str]
    context_snapshot: Optional[Dict[str, Any]]
    created_at: str
    updated_at: str

@router.post("/", response_model=StackResponse)
async def create_stack(stack: StackCreate, user_id: str = Depends(verify_token)):
    """Create a new stack for the authenticated user"""
    try:
        db_stack = db.create_stack(
            user_id=user_id,
            name=stack.name,
            description=stack.description
        )
        
        return StackResponse(
            id=db_stack.id,
            name=db_stack.name,
            description=db_stack.description,
            created_at=db_stack.created_at.isoformat(),
            updated_at=db_stack.updated_at.isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create stack: {str(e)}")

@router.get("/", response_model=List[StackResponse])
async def get_user_stacks(user_id: str = Depends(verify_token)):
    """Get all stacks for the authenticated user"""
    try:
        stacks = db.get_user_stacks(user_id)
        return [
            StackResponse(
                id=stack.id,
                name=stack.name,
                description=stack.description,
                created_at=stack.created_at.isoformat(),
                updated_at=stack.updated_at.isoformat()
            )
            for stack in stacks
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stacks: {str(e)}")

@router.get("/{stack_id}")
async def get_stack(stack_id: str, user_id: str = Depends(verify_token)):
    """Get a specific stack by ID with workflows"""
    try:
        stack = db.get_stack(stack_id)
        if not stack:
            raise HTTPException(status_code=404, detail="Stack not found")
        
        # Verify user owns this stack
        if stack.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get workflows with their details
        workflows = db.get_workflows_with_details(stack_id)
        
        # Get chats with their messages
        chats = db.get_chats_with_messages(stack_id)
        
        return {
            "id": stack.id,
            "name": stack.name,
            "description": stack.description,
            "created_at": stack.created_at.isoformat(),
            "updated_at": stack.updated_at.isoformat(),
            "workflows": workflows,
            "chats": chats
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get stack: {str(e)}")

@router.delete("/{stack_id}")
async def delete_stack(stack_id: str, user_id: str = Depends(verify_token)):
    """Delete a stack and all its associated data"""
    try:
        # Verify stack exists and user owns it
        stack = db.get_stack(stack_id)
        if not stack:
            raise HTTPException(status_code=404, detail="Stack not found")
        if stack.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Delete the stack (this should cascade delete workflows, chats, etc.)
        db.delete_stack(stack_id)
        
        return {"message": "Stack deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete stack: {str(e)}")

@router.post("/{stack_id}/workflows", response_model=WorkflowResponse)
async def create_workflow(
    stack_id: str, 
    workflow: WorkflowCreate, 
    user_id: str = Depends(verify_token)
):
    """Create a new workflow in a stack"""
    try:
        # Verify stack exists and user owns it
        stack = db.get_stack(stack_id)
        if not stack:
            raise HTTPException(status_code=404, detail="Stack not found")
        if stack.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Create workflow
        db_workflow = db.create_workflow(
            stack_id=stack_id,
            name=workflow.name,
            description=workflow.description,
            nodes=workflow.nodes,
            edges=workflow.edges,
            node_configs=workflow.node_configs
        )
        
        # Log event
        db.log_event(
            stack_id=stack_id,
            event_type="workflow_created",
            payload={
                "workflow_id": db_workflow.id,
                "workflow_name": workflow.name,
                "user_id": user_id
            }
        )
        
        return WorkflowResponse(
            id=db_workflow.id,
            name=db_workflow.name,
            description=db_workflow.description,
            node_configs=db_workflow.node_configs,
            created_at=db_workflow.created_at.isoformat(),
            updated_at=db_workflow.updated_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create workflow: {str(e)}")

@router.put("/{stack_id}/workflows/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    stack_id: str,
    workflow_id: str,
    workflow: WorkflowCreate,
    user_id: str = Depends(verify_token)
):
    """Update an existing workflow"""
    try:
        # Verify stack exists and user owns it
        stack = db.get_stack(stack_id)
        if not stack:
            raise HTTPException(status_code=404, detail="Stack not found")
        if stack.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update workflow
        db_workflow = db.update_workflow(
            workflow_id=workflow_id,
            name=workflow.name,
            description=workflow.description,
            nodes=workflow.nodes,
            edges=workflow.edges,
            node_configs=workflow.node_configs
        )
        
        # Log event
        db.log_event(
            stack_id=stack_id,
            event_type="workflow_updated",
            payload={
                "workflow_id": workflow_id,
                "workflow_name": workflow.name,
                "user_id": user_id
            }
        )
        
        return WorkflowResponse(
            id=db_workflow.id,
            name=db_workflow.name,
            description=db_workflow.description,
            node_configs=db_workflow.node_configs,
            created_at=db_workflow.created_at.isoformat(),
            updated_at=db_workflow.updated_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update workflow: {str(e)}")

@router.post("/{stack_id}/chats", response_model=ChatResponse)
async def create_chat(
    stack_id: str,
    chat: ChatCreate,
    user_id: str = Depends(verify_token)
):
    """Create a new chat session for a stack"""
    try:
        # Verify stack exists and user owns it
        stack = db.get_stack(stack_id)
        if not stack:
            raise HTTPException(status_code=404, detail="Stack not found")
        if stack.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Create chat
        db_chat = db.create_chat(
            stack_id=stack_id,
            title=chat.title,
            context_snapshot=chat.context_snapshot
        )
        
        # Log event
        db.log_event(
            stack_id=stack_id,
            event_type="chat_started",
            payload={
                "chat_id": db_chat.id,
                "chat_title": chat.title,
                "user_id": user_id
            }
        )
        
        return ChatResponse(
            id=db_chat.id,
            title=db_chat.title,
            context_snapshot=db_chat.context_snapshot,
            created_at=db_chat.created_at.isoformat(),
            updated_at=db_chat.updated_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")

@router.post("/chats/{chat_id}/messages")
async def add_message(
    chat_id: str,
    message: dict,
    user_id: str = Depends(verify_token)
):
    """Add a message to a chat"""
    try:
        # Verify chat exists and user owns it
        chat = db.get_chat(chat_id)
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found")
        
        # Verify user owns the stack that contains this chat
        stack = db.get_stack(chat.stack_id)
        if stack.user_id != user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Add message
        db_message = db.add_message(
            chat_id=chat_id,
            role=message.get('role', 'user'),
            content=message.get('content', ''),
            model=message.get('model'),
            used_knowledge_base=message.get('used_knowledge_base', False),
            used_web_search=message.get('used_web_search', False),
            sources=message.get('sources')
        )
        
        return {
            "id": db_message.id,
            "role": db_message.role,
            "content": db_message.content,
            "model": db_message.model,
            "used_knowledge_base": db_message.used_knowledge_base,
            "used_web_search": db_message.used_web_search,
            "sources": db_message.sources,
            "created_at": db_message.created_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add message: {str(e)}")
