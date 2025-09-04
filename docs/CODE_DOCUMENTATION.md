# AI Planet - Code Documentation

## 📚 **Code Architecture Overview**

This document provides a comprehensive overview of the AI Planet codebase, including key components, their roles, and interactions to clarify the structure and flow.

## 🏗️ **Project Structure**

```
AI_Planet/
├── frontend/                    # React TypeScript Frontend
│   ├── src/
│   │   ├── components/          # React Components
│   │   │   ├── auth/           # Authentication Components
│   │   │   ├── chat/           # Chat Interface
│   │   │   ├── dashboard/      # Dashboard Management
│   │   │   ├── layout/         # Layout Components
│   │   │   └── workflow/       # Workflow Builder
│   │   │       └── nodes/      # Workflow Node Components
│   │   ├── services/           # API Services
│   │   ├── App.tsx            # Main Application Component
│   │   └── main.tsx           # Application Entry Point
│   ├── public/                 # Static Assets
│   ├── package.json           # Frontend Dependencies
│   └── README.md              # Frontend Documentation
├── backend/                    # FastAPI Python Backend
│   ├── routers/               # API Route Definitions
│   ├── services/              # Business Logic Services
│   ├── models/               # Database Models
│   ├── chroma_db/            # Vector Database Storage
│   ├── main.py               # Application Entry Point
│   ├── pyproject.toml        # Python Dependencies
│   └── README.md             # Backend Documentation
├── docker-compose.yml         # Database Services
├── README.md                  # Project Overview
├── ARCHITECTURE.md            # System Architecture
└── CODE_DOCUMENTATION.md      # This Document
```

## 🎯 **Frontend Code Architecture**

### **1. Main Application (`App.tsx`)**

**Purpose**: Central state management and application routing

**Key Responsibilities**:
- Global state management with `AppState` object
- Authentication state handling
- Workflow data management
- Chat history management
- Modal state management

**Key Components**:
```typescript
interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  currentStackId: string | null;
  currentWorkflowId: string | null;
  workflowData: WorkflowData;
  chatData: ChatData;
  currentView: 'dashboard' | 'workflow';
  showLoginModal: boolean;
  showCreateStackModal: boolean;
  showChatModal: boolean;
}
```

**Data Flow**:
1. **Authentication**: JWT token management and user state
2. **Workflow Management**: Stack and workflow data persistence
3. **Chat Integration**: Real-time chat with AI workflows
4. **State Updates**: Centralized state updates via `updateState` helper

### **2. Component Architecture**

#### **Authentication Components (`auth/`)**
- **`LoginModal.tsx`**: User login interface
- **`RegisterModal.tsx`**: User registration interface

**Key Features**:
- Form validation with error handling
- JWT token storage in localStorage
- Automatic redirect after authentication
- Responsive design with Tailwind CSS

#### **Dashboard Components (`dashboard/`)**
- **`Dashboard.tsx`**: Main dashboard interface
- **`CreateStackModal.tsx`**: Stack creation modal

**Key Features**:
- Stack management (CRUD operations)
- Search and filtering capabilities
- Modern card-based UI design
- Delete confirmation modals

#### **Workflow Components (`workflow/`)**
- **`Canvas.tsx`**: Main workflow builder canvas
- **`nodes/`**: Individual workflow node components

**Key Features**:
- React Flow integration for drag-and-drop
- Real-time connection validation
- Node configuration management
- Workflow persistence

#### **Chat Components (`chat/`)**
- **`ChatModal.tsx`**: Real-time chat interface

**Key Features**:
- Real-time message display
- Markdown rendering for AI responses
- Message history persistence
- Loading states and error handling

### **3. Service Layer (`services/api.ts`)**

**Purpose**: Centralized API communication layer

**Key Functions**:
```typescript
class ApiService {
  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse>
  async register(userData: RegisterData): Promise<AuthResponse>
  async getCurrentUser(): Promise<User>

  // Stack Management
  async getStacks(): Promise<Stack[]>
  async createStack(data: StackCreate): Promise<Stack>
  async deleteStack(stackId: string): Promise<void>

  // Workflow Management
  async createWorkflow(stackId: string, data: WorkflowCreate): Promise<Workflow>
  async updateWorkflow(workflowId: string, data: WorkflowUpdate): Promise<Workflow>

  // AI Operations
  async uploadDocument(file: File): Promise<UploadResponse>
  async embedDocument(data: EmbedRequest): Promise<EmbedResponse>
  async runWorkflow(data: WorkflowRequest): Promise<WorkflowResponse>
  async chat(data: ChatRequest): Promise<ChatResponse>
}
```

## 🔧 **Backend Code Architecture**

### **1. Main Application (`main.py`)**

**Purpose**: FastAPI application configuration and startup

**Key Features**:
- CORS configuration for frontend integration
- Router registration and API prefixing
- Database initialization
- Environment variable management

**Configuration**:
```python
app = FastAPI(
    title="AI Planet API",
    description="AI Workflow Builder API",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### **2. Router Architecture (`routers/`)**

#### **Authentication Router (`auth.py`)**
**Endpoints**:
- `POST /api/auth/register`: User registration
- `POST /api/auth/login`: User authentication
- `GET /api/auth/me`: Get current user

**Key Features**:
- JWT token generation and validation
- Password hashing with bcrypt
- User data validation with Pydantic models

#### **Stack Management Router (`stacks.py`)**
**Endpoints**:
- `GET /api/stacks/`: List user stacks
- `POST /api/stacks/`: Create new stack
- `GET /api/stacks/{id}`: Get stack details
- `DELETE /api/stacks/{id}`: Delete stack

**Key Features**:
- User authorization checks
- Cascading deletion of related data
- Comprehensive error handling

#### **Workflow Router (`workflow.py`)**
**Endpoints**:
- `POST /api/upload-doc`: Document upload
- `POST /api/embed-doc`: Document embedding
- `POST /api/run-workflow`: Workflow execution
- `POST /api/chat`: AI chat interface

**Key Features**:
- PDF processing with PyMuPDF
- Vector embedding with ChromaDB
- AI model integration (OpenAI/Gemini)
- Web search integration

### **3. Service Layer (`services/`)**

#### **Database Service (`database.py`)**
**Purpose**: Database operations and data persistence

**Key Methods**:
```python
class DatabaseService:
    # User Operations
    def create_user(self, email: str, username: str, password_hash: str) -> User
    def get_user_by_email(self, email: str) -> Optional[User]
    def get_user_by_id(self, user_id: str) -> Optional[User]

    # Stack Operations
    def create_stack(self, user_id: str, name: str, description: str) -> Stack
    def get_user_stacks(self, user_id: str) -> List[Stack]
    def delete_stack(self, stack_id: str) -> bool

    # Workflow Operations
    def create_workflow(self, stack_id: str, name: str, nodes: List, edges: List) -> Workflow
    def update_workflow(self, workflow_id: str, data: dict) -> Workflow
    def get_workflows_with_details(self, stack_id: str) -> List[dict]

    # Chat Operations
    def create_chat(self, stack_id: str, title: str) -> Chat
    def add_message(self, chat_id: str, role: str, content: str) -> Message
    def get_chat_messages(self, chat_id: str) -> List[Message]
```

#### **LLM Service (`llm_service.py`)**
**Purpose**: AI model integration and text generation

**Key Features**:
- OpenAI GPT integration
- Google Gemini integration
- Prompt engineering and formatting
- Response processing and validation

#### **Vector Service (`vector_service.py`)**
**Purpose**: Document embedding and vector search

**Key Features**:
- ChromaDB integration
- Document text extraction
- Vector embedding generation
- Semantic search capabilities

### **4. Data Models (`models/database.py`)**

**Purpose**: SQLAlchemy ORM models and database schema

**Key Models**:
```python
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Stack(Base):
    __tablename__ = "stacks"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stack_id = Column(UUID(as_uuid=True), ForeignKey("stacks.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    node_configs = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

## 🔄 **Data Flow Patterns**

### **1. Authentication Flow**
```
Frontend (Login) → API Service → Backend Router → Database Service → Database
     ↑                                                                    ↓
Frontend (Store Token) ← API Service ← Backend Router ← Database Service ← Database
```

### **2. Workflow Creation Flow**
```
Frontend (Canvas) → API Service → Backend Router → Database Service → Database
     ↑                                                                    ↓
Frontend (Update UI) ← API Service ← Backend Router ← Database Service ← Database
```

### **3. AI Workflow Execution Flow**
```
Frontend (Chat) → API Service → Backend Router → LLM Service → AI Models
     ↑                                                                    ↓
Frontend (Display) ← API Service ← Backend Router ← LLM Service ← AI Models
```

### **4. Document Processing Flow**
```
Frontend (Upload) → API Service → Backend Router → Vector Service → ChromaDB
     ↑                                                                    ↓
Frontend (Success) ← API Service ← Backend Router ← Vector Service ← ChromaDB
```

## 🎨 **UI/UX Design Patterns**

### **1. Component Design Principles**
- **Atomic Design**: Reusable components with clear hierarchy
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: WCAG compliant components
- **Consistency**: Unified design system across components

### **2. State Management Patterns**
- **Centralized State**: Single source of truth for global state
- **Local State**: Component-specific state management
- **Event-Driven**: React Flow event handling
- **Persistence**: Local storage for authentication

### **3. Error Handling Patterns**
- **Graceful Degradation**: Fallback UI for errors
- **User Feedback**: Clear error messages and loading states
- **Retry Mechanisms**: Automatic retry for failed requests
- **Validation**: Client and server-side validation

## 🔒 **Security Implementation**

### **1. Authentication Security**
- **JWT Tokens**: Stateless authentication with expiration
- **Password Hashing**: bcrypt for secure password storage
- **Token Storage**: Secure localStorage management
- **CORS Configuration**: Proper cross-origin handling

### **2. Data Validation**
- **Input Sanitization**: Comprehensive input validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: React's built-in XSS protection
- **File Upload Security**: Type and size validation

### **3. API Security**
- **Rate Limiting**: Request rate limiting
- **Error Handling**: Secure error messages
- **Logging**: Comprehensive audit trails
- **HTTPS Enforcement**: Production HTTPS requirement

## 📊 **Performance Optimizations**

### **1. Frontend Optimizations**
- **Code Splitting**: Dynamic imports for lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: Browser caching for static assets
- **Virtual Scrolling**: Efficient list rendering

### **2. Backend Optimizations**
- **Database Indexing**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Response caching for AI models
- **Async Processing**: Non-blocking I/O operations

### **3. AI Service Optimizations**
- **Model Caching**: Cache AI model responses
- **Batch Processing**: Efficient document processing
- **Vector Search**: Optimized similarity search
- **Response Streaming**: Real-time response delivery

## 🧪 **Testing Strategy**

### **1. Frontend Testing**
- **Unit Tests**: Component testing with React Testing Library
- **Integration Tests**: API integration testing
- **E2E Tests**: End-to-end workflow testing
- **Visual Tests**: UI component regression testing

### **2. Backend Testing**
- **Unit Tests**: Service layer testing with pytest
- **API Tests**: Endpoint testing with FastAPI TestClient
- **Database Tests**: Database operation testing
- **Integration Tests**: External service integration

### **3. Performance Testing**
- **Load Testing**: Concurrent user simulation
- **Stress Testing**: System limits testing
- **Memory Testing**: Memory leak detection
- **Response Time**: API response time measurement

## 🔧 **Development Workflow**

### **1. Code Organization**
- **Feature-Based**: Components organized by feature
- **Service Separation**: Clear separation of concerns
- **Type Safety**: Comprehensive TypeScript usage
- **Documentation**: Inline code documentation

### **2. Version Control**
- **Git Flow**: Feature branch workflow
- **Commit Messages**: Conventional commit format
- **Code Review**: Pull request review process
- **Continuous Integration**: Automated testing and deployment

### **3. Development Tools**
- **ESLint**: Code quality and consistency
- **Prettier**: Code formatting
- **TypeScript**: Type safety and IntelliSense
- **Hot Reload**: Fast development iteration

## 📈 **Scalability Considerations**

### **1. Horizontal Scaling**
- **Load Balancing**: Multiple application instances
- **Database Sharding**: Distributed data storage
- **CDN Integration**: Global content delivery
- **Microservices**: Service decomposition

### **2. Vertical Scaling**
- **Resource Optimization**: Efficient resource usage
- **Caching Layers**: Multi-level caching strategy
- **Database Optimization**: Query and index optimization
- **AI Model Optimization**: Model compression and optimization

## 🔄 **Integration Patterns**

### **1. External Services**
- **OpenAI API**: GPT model integration
- **Google Gemini**: Alternative AI model
- **SerpAPI**: Web search integration
- **ChromaDB**: Vector database service

### **2. Data Integration**
- **PDF Processing**: PyMuPDF for document extraction
- **Text Embedding**: Sentence transformers for vectorization
- **JSON Processing**: Flexible data serialization
- **File Storage**: Local and cloud storage options

---

## 🎯 **Key Implementation Decisions**

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

This code documentation provides a comprehensive overview of the AI Planet implementation, highlighting the key architectural decisions, patterns, and implementation details that make the system robust, scalable, and maintainable.
