# AI Planet - Architecture & Design Document

## 🏗️ **System Architecture Overview**

### **High-Level System Design**

```
┌─────────────────────────────────────────────────────────────────┐
│                        AI Planet Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Frontend      │    │   Backend       │    │   Infrastructure │ │
│  │   (React + TS)  │◄──►│   (FastAPI)     │◄──►│   (Docker)       │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                       │                       │         │
│           │                       │                       │         │
│           ▼                       ▼                       ▼         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   React Flow    │    │   AI Services   │    │   PostgreSQL    │ │
│  │   (Workflows)   │    │   (LLM + NLP)   │    │   (Data Store)  │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│           │                       │                       │         │
│           │                       │                       │         │
│           ▼                       ▼                       ▼         │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐ │
│  │   Chat UI       │    │   ChromaDB      │    │   Vector Store   │ │
│  │   (Real-time)   │    │   (Embeddings)  │    │   (Documents)   │ │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 **Component Architecture**

### **1. Frontend Architecture (React + TypeScript)**

#### **Core Components**
```
src/
├── components/
│   ├── auth/           # Authentication components
│   │   ├── LoginModal.tsx
│   │   └── RegisterModal.tsx
│   ├── dashboard/      # Dashboard management
│   │   ├── Dashboard.tsx
│   │   └── CreateStackModal.tsx
│   ├── workflow/       # Workflow builder
│   │   ├── Canvas.tsx
│   │   └── nodes/
│   │       ├── UserQueryNode.tsx
│   │       ├── LLMEngineNode.tsx
│   │       ├── KnowledgeBaseNode.tsx
│   │       ├── WebSearchNode.tsx
│   │       └── OutputNode.tsx
│   ├── chat/          # Chat interface
│   │   └── ChatModal.tsx
│   └── layout/         # Layout components
│       ├── Header.tsx
│       └── Sidebar.tsx
├── services/           # API services
│   └── api.ts
└── App.tsx            # Main application
```

#### **State Management**
- **Centralized State**: Single `AppState` object with `updateState` helper
- **Component State**: Local state for component-specific data
- **Data Flow**: Props down, events up pattern
- **Persistence**: Local storage for authentication tokens

#### **Key Design Patterns**
- **Container/Presentational**: Separation of logic and presentation
- **Custom Hooks**: Reusable stateful logic
- **Context API**: Global state management
- **Event-Driven**: React Flow event handling

### **2. Backend Architecture (FastAPI + Python)**

#### **Service Layer Architecture**
```
backend/
├── routers/           # API route definitions
│   ├── auth.py        # Authentication endpoints
│   ├── stacks.py      # Stack management
│   ├── workflow.py    # AI workflow execution
│   └── workflow_storage.py  # Workflow persistence
├── services/          # Business logic
│   ├── database.py    # Database operations
│   ├── llm_service.py # AI model integration
│   └── vector_service.py  # Vector operations
├── models/           # Data models
│   └── database.py   # SQLAlchemy models
└── main.py          # Application entry point
```

#### **API Design Principles**
- **RESTful**: Standard HTTP methods and status codes
- **Stateless**: JWT-based authentication
- **Versioned**: API versioning for future compatibility
- **Documented**: Auto-generated OpenAPI documentation

#### **Database Design**
```sql
-- Core Tables
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stacks (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflows (
    id UUID PRIMARY KEY,
    stack_id UUID REFERENCES stacks(id),
    name VARCHAR NOT NULL,
    description TEXT,
    node_configs JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_nodes (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id),
    type VARCHAR NOT NULL,
    data JSONB,
    position JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE workflow_edges (
    id UUID PRIMARY KEY,
    workflow_id UUID REFERENCES workflows(id),
    source VARCHAR NOT NULL,
    target VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chats (
    id UUID PRIMARY KEY,
    stack_id UUID REFERENCES stacks(id),
    title VARCHAR,
    context_snapshot JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY,
    chat_id UUID REFERENCES chats(id),
    role VARCHAR NOT NULL,
    content TEXT NOT NULL,
    model VARCHAR,
    used_knowledge_base BOOLEAN DEFAULT FALSE,
    used_web_search BOOLEAN DEFAULT FALSE,
    sources JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔄 **Data Flow Architecture**

### **1. User Authentication Flow**
```
1. User submits login credentials
2. Frontend sends POST /api/auth/login
3. Backend validates credentials
4. Backend generates JWT token
5. Frontend stores token in localStorage
6. Frontend includes token in subsequent requests
```

### **2. Workflow Creation Flow**
```
1. User drags nodes onto canvas
2. User connects nodes with edges
3. Frontend validates connections
4. User clicks "Build Stack"
5. Frontend sends workflow data to backend
6. Backend stores workflow in database
7. Backend returns success response
```

### **3. AI Workflow Execution Flow**
```
1. User submits query in chat
2. Frontend sends query to backend
3. Backend retrieves workflow configuration
4. Backend executes workflow step by step:
   a. Process user query
   b. Retrieve from knowledge base (if configured)
   c. Call AI model (OpenAI/Gemini)
   d. Perform web search (if configured)
   e. Format response
5. Backend stores conversation in database
6. Frontend displays response
```

### **4. Document Processing Flow**
```
1. User uploads PDF document
2. Frontend sends file to /api/upload-doc
3. Backend processes PDF with PyMuPDF
4. Backend extracts text content
5. Backend generates embeddings with ChromaDB
6. Backend stores embeddings in vector database
7. Backend returns success response
```

## 🔒 **Security Architecture**

### **Authentication & Authorization**
- **JWT Tokens**: Stateless authentication
- **Token Expiration**: Configurable token lifetime
- **Password Hashing**: bcrypt for secure password storage
- **CORS Configuration**: Proper cross-origin handling

### **Data Protection**
- **Input Validation**: Pydantic models for request validation
- **SQL Injection Prevention**: Parameterized queries with SQLAlchemy
- **File Upload Security**: Type and size validation
- **XSS Prevention**: React's built-in XSS protection

### **API Security**
- **Rate Limiting**: Configurable request limits
- **Request Logging**: Comprehensive audit trails
- **Error Handling**: Secure error messages
- **HTTPS Enforcement**: Production HTTPS requirement

## 📊 **Performance Architecture**

### **Frontend Optimization**
- **Code Splitting**: Dynamic imports for lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Browser caching for static assets
- **Virtual Scrolling**: Efficient list rendering

### **Backend Optimization**
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for session and data caching
- **Async Processing**: Non-blocking I/O operations

### **AI Service Optimization**
- **Model Caching**: Cache AI model responses
- **Batch Processing**: Efficient document processing
- **Vector Search**: Optimized similarity search
- **Response Streaming**: Real-time response delivery

## 🔧 **Deployment Architecture**

### **Development Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vite Dev)    │◄──►│   (FastAPI)     │◄──►│   (Docker)      │
│   Port: 5173    │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Production Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer  │    │   Application   │    │   Database      │
│   (Nginx)       │◄──►│   (Docker)       │◄──►│   (PostgreSQL)  │
│   Port: 80/443  │    │   Port: 8000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🧪 **Testing Architecture**

### **Frontend Testing**
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end workflow testing
- **Visual Tests**: UI component regression testing

### **Backend Testing**
- **Unit Tests**: Service layer testing with pytest
- **API Tests**: Endpoint testing with FastAPI TestClient
- **Database Tests**: Database operation testing
- **Integration Tests**: External service integration

### **Performance Testing**
- **Load Testing**: Concurrent user simulation
- **Stress Testing**: System limits testing
- **Memory Testing**: Memory leak detection
- **Response Time**: API response time measurement

## 📈 **Scalability Architecture**

### **Horizontal Scaling**
- **Load Balancing**: Multiple application instances
- **Database Sharding**: Distributed data storage
- **CDN Integration**: Global content delivery
- **Microservices**: Service decomposition

### **Vertical Scaling**
- **Resource Optimization**: Efficient resource usage
- **Caching Layers**: Multi-level caching strategy
- **Database Optimization**: Query and index optimization
- **AI Model Optimization**: Model compression and optimization

## 🔄 **Integration Architecture**

### **External Services**
- **OpenAI API**: GPT model integration
- **Google Gemini**: Alternative AI model
- **SerpAPI**: Web search integration
- **ChromaDB**: Vector database service

### **Data Integration**
- **PDF Processing**: PyMuPDF for document extraction
- **Text Embedding**: Sentence transformers for vectorization
- **JSON Processing**: Flexible data serialization
- **File Storage**: Local and cloud storage options

## 📋 **Monitoring & Logging**

### **Application Monitoring**
- **Health Checks**: Service availability monitoring
- **Performance Metrics**: Response time and throughput
- **Error Tracking**: Exception and error logging
- **User Analytics**: Usage pattern analysis

### **Infrastructure Monitoring**
- **Resource Usage**: CPU, memory, and disk monitoring
- **Database Performance**: Query performance tracking
- **Network Monitoring**: Network latency and bandwidth
- **Security Monitoring**: Security event detection

---

## 🎯 **Key Design Decisions**

### **1. Technology Choices**
- **React + TypeScript**: Type safety and modern development experience
- **FastAPI**: High-performance Python web framework
- **PostgreSQL**: Reliable relational database
- **ChromaDB**: Efficient vector database for embeddings

### **2. Architecture Patterns**
- **Monolithic Backend**: Simplified deployment and development
- **Component-Based Frontend**: Reusable and maintainable UI
- **Event-Driven Workflows**: Flexible AI workflow execution
- **RESTful APIs**: Standard and interoperable interfaces

### **3. Data Management**
- **Normalized Database**: Efficient data storage and relationships
- **Vector Embeddings**: Semantic search capabilities
- **JSON Storage**: Flexible configuration storage
- **Real-time Updates**: WebSocket for live updates

### **4. Security Considerations**
- **JWT Authentication**: Stateless and scalable
- **Input Validation**: Comprehensive data validation
- **Secure File Handling**: Safe document processing
- **CORS Configuration**: Proper cross-origin handling

This architecture provides a solid foundation for a scalable, maintainable, and secure AI workflow platform.
