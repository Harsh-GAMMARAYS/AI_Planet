from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ai_planet_user:ai_planet_password@localhost:5432/ai_planet")

# Create engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    stacks = relationship("Stack", back_populates="user", cascade="all, delete-orphan")

class Stack(Base):
    __tablename__ = "stacks"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    user_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="stacks")
    workflows = relationship("Workflow", back_populates="stack", cascade="all, delete-orphan")
    chats = relationship("Chat", back_populates="stack", cascade="all, delete-orphan")

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    description = Column(Text, nullable=True)
    stack_id = Column(String, ForeignKey("stacks.id"))
    node_configs = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    stack = relationship("Stack", back_populates="workflows")
    workflow_nodes = relationship("WorkflowNode", back_populates="workflow", cascade="all, delete-orphan")
    workflow_edges = relationship("WorkflowEdge", back_populates="workflow", cascade="all, delete-orphan")

class WorkflowNode(Base):
    __tablename__ = "workflow_nodes"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    type = Column(String)  # 'user-query', 'llm-openai', 'knowledge-base', 'web-search', 'output'
    data = Column(JSON)
    position = Column(JSON)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    workflow = relationship("Workflow", back_populates="workflow_nodes")

class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"))
    source = Column(String)
    target = Column(String)
    label = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    workflow = relationship("Workflow", back_populates="workflow_edges")

class Chat(Base):
    __tablename__ = "chats"
    
    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=True)
    stack_id = Column(String, ForeignKey("stacks.id"))
    context_snapshot = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    stack = relationship("Stack", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String, primary_key=True, index=True)
    chat_id = Column(String, ForeignKey("chats.id"))
    role = Column(String)  # 'user' or 'ai'
    content = Column(Text)
    model = Column(String, nullable=True)
    used_knowledge_base = Column(Boolean, default=False)
    used_web_search = Column(Boolean, default=False)
    sources = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    chat = relationship("Chat", back_populates="messages")

class Event(Base):
    __tablename__ = "events"
    
    id = Column(String, primary_key=True, index=True)
    stack_id = Column(String, ForeignKey("stacks.id"))
    type = Column(String)  # 'workflow_created', 'workflow_updated', 'chat_started', etc.
    payload = Column(JSON)
    created_at = Column(DateTime, default=func.now())

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)
