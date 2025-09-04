from sqlalchemy.orm import Session
from models.database import (
    SessionLocal, User, Stack, Workflow, WorkflowNode, WorkflowEdge, 
    Chat, Message, Event, create_tables
)
from typing import Optional, List, Dict, Any
import uuid
from datetime import datetime

class DatabaseService:
    def __init__(self):
        self.db: Optional[Session] = None
    
    def get_db(self) -> Session:
        """Get database session"""
        if not self.db:
            self.db = SessionLocal()
        return self.db
    
    def close_db(self):
        """Close database session"""
        if self.db:
            self.db.close()
            self.db = None
    
    # User operations
    def create_user(self, email: str, username: str, password_hash: str) -> User:
        db = self.get_db()
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            username=username,
            password_hash=password_hash
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        db = self.get_db()
        return db.query(User).filter(User.email == email).first()
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        db = self.get_db()
        return db.query(User).filter(User.id == user_id).first()
    
    # Stack operations
    def create_stack(self, user_id: str, name: str, description: Optional[str] = None) -> Stack:
        db = self.get_db()
        stack = Stack(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name,
            description=description
        )
        db.add(stack)
        db.commit()
        db.refresh(stack)
        return stack
    
    def get_user_stacks(self, user_id: str) -> List[Stack]:
        db = self.get_db()
        return db.query(Stack).filter(Stack.user_id == user_id).order_by(Stack.updated_at.desc()).all()
    
    def get_stack(self, stack_id: str) -> Optional[Stack]:
        db = self.get_db()
        return db.query(Stack).filter(Stack.id == stack_id).first()
    
    def delete_stack(self, stack_id: str) -> bool:
        """Delete a stack and all its associated data"""
        db = self.get_db()
        try:
            # Get the stack
            stack = db.query(Stack).filter(Stack.id == stack_id).first()
            if not stack:
                return False
            
            # Delete associated workflows and their nodes/edges
            workflows = db.query(Workflow).filter(Workflow.stack_id == stack_id).all()
            for workflow in workflows:
                # Delete workflow nodes
                db.query(WorkflowNode).filter(WorkflowNode.workflow_id == workflow.id).delete()
                # Delete workflow edges
                db.query(WorkflowEdge).filter(WorkflowEdge.workflow_id == workflow.id).delete()
                # Delete workflow
                db.delete(workflow)
            
            # Delete associated chats and their messages
            chats = db.query(Chat).filter(Chat.stack_id == stack_id).all()
            for chat in chats:
                # Delete chat messages
                db.query(Message).filter(Message.chat_id == chat.id).delete()
                # Delete chat
                db.delete(chat)
            
            # Delete associated events
            db.query(Event).filter(Event.stack_id == stack_id).delete()
            
            # Finally delete the stack
            db.delete(stack)
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error deleting stack: {e}")
            return False
    
    # Workflow operations
    def create_workflow(self, stack_id: str, name: str, description: Optional[str] = None, 
                       nodes: List[Dict] = None, edges: List[Dict] = None, 
                       node_configs: Dict = None) -> Workflow:
        db = self.get_db()
        
        # Create workflow
        workflow = Workflow(
            id=str(uuid.uuid4()),
            stack_id=stack_id,
            name=name,
            description=description,
            node_configs=node_configs
        )
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        
        # Create nodes
        if nodes:
            for node_data in nodes:
                node = WorkflowNode(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow.id,
                    type=node_data['type'],
                    data=node_data.get('data', {}),
                    position=node_data.get('position', {'x': 0, 'y': 0})
                )
                db.add(node)
        
        # Create edges
        if edges:
            for edge_data in edges:
                edge = WorkflowEdge(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow.id,
                    source=edge_data['source'],
                    target=edge_data['target'],
                    label=edge_data.get('label')
                )
                db.add(edge)
        
        db.commit()
        return workflow
    
    def update_workflow(self, workflow_id: str, name: Optional[str] = None, 
                       description: Optional[str] = None, nodes: List[Dict] = None, 
                       edges: List[Dict] = None, node_configs: Dict = None) -> Workflow:
        db = self.get_db()
        
        # Get workflow
        workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
        if not workflow:
            raise ValueError("Workflow not found")
        
        # Update workflow fields
        if name is not None:
            workflow.name = name
        if description is not None:
            workflow.description = description
        if node_configs is not None:
            workflow.node_configs = node_configs
        
        # Update nodes and edges if provided
        if nodes is not None:
            # Delete existing nodes
            db.query(WorkflowNode).filter(WorkflowNode.workflow_id == workflow_id).delete()
            # Create new nodes
            for node_data in nodes:
                node = WorkflowNode(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    type=node_data['type'],
                    data=node_data.get('data', {}),
                    position=node_data.get('position', {'x': 0, 'y': 0})
                )
                db.add(node)
        
        if edges is not None:
            print(f"🔗 Saving {len(edges)} edges for workflow {workflow_id}")
            # Delete existing edges
            db.query(WorkflowEdge).filter(WorkflowEdge.workflow_id == workflow_id).delete()
            # Create new edges
            for edge_data in edges:
                print(f"🔗 Creating edge: {edge_data}")
                edge = WorkflowEdge(
                    id=str(uuid.uuid4()),
                    workflow_id=workflow_id,
                    source=edge_data['source'],
                    target=edge_data['target'],
                    label=edge_data.get('label')
                )
                db.add(edge)
        
        db.commit()
        db.refresh(workflow)
        return workflow
    
    def get_workflow(self, workflow_id: str) -> Optional[Workflow]:
        db = self.get_db()
        return db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    def get_workflows_with_details(self, stack_id: str) -> List[Dict]:
        """Get all workflows for a stack with their nodes and edges"""
        db = self.get_db()
        workflows = db.query(Workflow).filter(Workflow.stack_id == stack_id).all()
        
        result = []
        for workflow in workflows:
            # Get nodes for this workflow
            nodes = db.query(WorkflowNode).filter(WorkflowNode.workflow_id == workflow.id).all()
            node_data = [
                {
                    'id': node.id,
                    'type': node.type,
                    'data': node.data,
                    'position': node.position
                }
                for node in nodes
            ]
            
            # Get edges for this workflow
            edges = db.query(WorkflowEdge).filter(WorkflowEdge.workflow_id == workflow.id).all()
            print(f"🔗 Loading {len(edges)} edges for workflow {workflow.id}")
            edge_data = [
                {
                    'id': edge.id,
                    'source': edge.source,
                    'target': edge.target,
                    'label': edge.label
                }
                for edge in edges
            ]
            
            result.append({
                'id': workflow.id,
                'name': workflow.name,
                'description': workflow.description,
                'node_configs': workflow.node_configs,
                'nodes': node_data,
                'edges': edge_data,
                'created_at': workflow.created_at,
                'updated_at': workflow.updated_at
            })
        
        return result
    
    def get_chats_with_messages(self, stack_id: str) -> List[Dict]:
        """Get all chats for a stack with their messages"""
        db = self.get_db()
        chats = db.query(Chat).filter(Chat.stack_id == stack_id).order_by(Chat.created_at.desc()).all()
        
        result = []
        for chat in chats:
            # Get messages for this chat
            messages = db.query(Message).filter(Message.chat_id == chat.id).order_by(Message.created_at).all()
            message_data = [
                {
                    'id': message.id,
                    'role': message.role,
                    'content': message.content,
                    'model': message.model,
                    'used_knowledge_base': message.used_knowledge_base,
                    'used_web_search': message.used_web_search,
                    'sources': message.sources,
                    'created_at': message.created_at.isoformat()
                }
                for message in messages
            ]
            
            result.append({
                'id': chat.id,
                'title': chat.title,
                'context_snapshot': chat.context_snapshot,
                'messages': message_data,
                'created_at': chat.created_at.isoformat(),
                'updated_at': chat.updated_at.isoformat()
            })
        
        return result
    
    # Chat operations
    def create_chat(self, stack_id: str, title: Optional[str] = None, 
                   context_snapshot: Optional[Dict] = None) -> Chat:
        db = self.get_db()
        chat = Chat(
            id=str(uuid.uuid4()),
            stack_id=stack_id,
            title=title,
            context_snapshot=context_snapshot
        )
        db.add(chat)
        db.commit()
        db.refresh(chat)
        return chat
    
    def get_chat(self, chat_id: str) -> Optional[Chat]:
        db = self.get_db()
        return db.query(Chat).filter(Chat.id == chat_id).first()
    
    def add_message(self, chat_id: str, role: str, content: str, 
                   model: Optional[str] = None, used_knowledge_base: bool = False,
                   used_web_search: bool = False, sources: Optional[Dict] = None) -> Message:
        db = self.get_db()
        message = Message(
            id=str(uuid.uuid4()),
            chat_id=chat_id,
            role=role,
            content=content,
            model=model,
            used_knowledge_base=used_knowledge_base,
            used_web_search=used_web_search,
            sources=sources
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message
    
    def get_chat_messages(self, chat_id: str) -> List[Message]:
        db = self.get_db()
        return db.query(Message).filter(Message.chat_id == chat_id).order_by(Message.created_at.asc()).all()
    
    def get_chat(self, chat_id: str) -> Optional[Chat]:
        db = self.get_db()
        return db.query(Chat).filter(Chat.id == chat_id).first()
    
    # Event logging
    def log_event(self, stack_id: str, event_type: str, payload: Dict) -> Event:
        db = self.get_db()
        event = Event(
            id=str(uuid.uuid4()),
            stack_id=stack_id,
            type=event_type,
            payload=payload
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

# Global database instance
db = DatabaseService()

# Initialize database tables
def init_db():
    """Initialize database tables"""
    create_tables()
    print("✅ Database tables created")
