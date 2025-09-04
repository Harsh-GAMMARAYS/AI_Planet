# AI Planet - AI Workflow Builder

A full-stack AI workflow builder application that allows users to create, manage, and execute AI workflows through a visual drag-and-drop interface.

## 🚀 **Live Demo**

**Hosted Application**: [AI Planet - Live Demo](http://localhost:5173) (Local Development)

## 📁 **Source Code**

**GitHub Repository**: [AI Planet Source Code](https://github.com/your-username/AI_Planet)

## 🏗️ **Architecture & Design**

### **High-Level Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React + TS)  │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Flow    │    │   ChromaDB      │    │   Vector Store   │
│   (Workflows)   │    │   (Embeddings)  │    │   (Documents)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Technology Stack**

#### **Frontend**
- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Tailwind CSS + Lucide React Icons
- **Workflow Engine**: React Flow (@xyflow/react)
- **HTTP Client**: Axios
- **State Management**: React Hooks + Context

#### **Backend**
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL + SQLAlchemy ORM
- **Vector Database**: ChromaDB
- **AI Models**: OpenAI GPT + Google Gemini
- **PDF Processing**: PyMuPDF
- **Package Manager**: AstralUV (uv)

#### **Infrastructure**
- **Containerization**: Docker + Docker Compose
- **Authentication**: JWT Tokens
- **API Documentation**: FastAPI Auto-Generated

## 🎯 **Key Features**

### **1. Visual Workflow Builder**
- Drag-and-drop interface for creating AI workflows
- Four main node types: User Query, Knowledge Base, LLM Engine, Output
- Real-time connection validation
- Workflow persistence and versioning

### **2. AI Integration**
- **OpenAI GPT**: Text generation and chat
- **Google Gemini**: Alternative AI model support
- **Web Search**: SerpAPI integration for real-time information
- **Document Processing**: PDF upload and embedding with ChromaDB

### **3. Knowledge Management**
- Document upload and processing
- Vector embeddings with ChromaDB
- Semantic search capabilities
- Context-aware AI responses

### **4. User Experience**
- Modern, responsive design
- Real-time chat interface
- Stack-based organization
- Authentication system
- Error handling and validation

## 🔧 **Installation & Setup**

### **Prerequisites**
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL (via Docker)

### **Quick Start**

1. **Clone the repository**
```bash
git clone https://github.com/your-username/AI_Planet.git
cd AI_Planet
```

2. **Start the backend**
```bash
cd backend
uv sync
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. **Start the frontend**
```bash
cd frontend
npm install
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📊 **Database Schema**

### **Core Tables**
- `users`: User authentication and profiles
- `stacks`: Workflow organization containers
- `workflows`: Individual workflow definitions
- `workflow_nodes`: Workflow node configurations
- `workflow_edges`: Workflow connections
- `chats`: Chat sessions
- `messages`: Chat message history
- `events`: System event logging

## 🔌 **API Endpoints**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Stacks & Workflows**
- `GET /api/stacks/` - List user stacks
- `POST /api/stacks/` - Create new stack
- `DELETE /api/stacks/{id}` - Delete stack
- `POST /api/stacks/{id}/workflows` - Create workflow
- `PUT /api/stacks/{id}/workflows/{id}` - Update workflow

### **AI Operations**
- `POST /api/upload-doc` - Upload PDF documents
- `POST /api/embed-doc` - Generate embeddings
- `POST /api/run-workflow` - Execute workflow
- `POST /api/chat` - Chat with AI
- `GET /api/search` - Search knowledge base

## 🎨 **UI/UX Design**

### **Design Principles**
- **Modern & Clean**: Minimalist design with emerald green theme
- **Responsive**: Mobile-first approach
- **Accessible**: WCAG compliant components
- **Intuitive**: Clear visual hierarchy and navigation

### **Key Components**
- **Dashboard**: Stack management and overview
- **Workflow Canvas**: Visual workflow builder
- **Chat Interface**: Real-time AI conversations
- **Modal System**: Consistent overlay patterns

## 🔒 **Security Features**

- **JWT Authentication**: Secure token-based auth
- **Input Validation**: Comprehensive data validation
- **CORS Configuration**: Proper cross-origin handling
- **SQL Injection Prevention**: Parameterized queries
- **File Upload Security**: Type and size validation

## 📈 **Performance Optimizations**

- **React Optimization**: Memoization and lazy loading
- **Database Indexing**: Optimized queries
- **Caching**: Vector embedding caching
- **Bundle Optimization**: Tree shaking and code splitting

## 🧪 **Testing Strategy**

- **Frontend**: Component testing with React Testing Library
- **Backend**: API testing with pytest
- **Integration**: End-to-end workflow testing
- **Performance**: Load testing for concurrent users

## 🚀 **Deployment**

### **Development**
```bash
# Backend
cd backend && uvicorn main:app --reload

# Frontend
cd frontend && npm run dev
```

### **Production**
```bash
# Using Docker Compose
docker-compose up -d
```

## 📝 **API Documentation**

Comprehensive API documentation is automatically generated by FastAPI and available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 👨‍💻 **Author**

**AI Planet Team**
- **GitHub**: [Your GitHub Profile]
- **Email**: [Your Email]

---

## 🎥 **Demo Video Content**

The demo video showcases:
1. **User Registration & Login**
2. **Creating New Stacks**
3. **Building AI Workflows** (drag-and-drop)
4. **Uploading Documents** (PDF processing)
5. **Chatting with AI** (real-time conversations)
6. **Workflow Execution** (end-to-end process)
7. **Stack Management** (CRUD operations)

## 📚 **Documentation**

For comprehensive technical documentation:
- **📋 Documentation Index**: [Complete Documentation Guide](docs/README.md)
- **🏗️ HLD/LLD Design**: [System Design Document](docs/HLD_LLD_DESIGN.md)
- **🏛️ Architecture**: [Technical Architecture](docs/ARCHITECTURE.md)
- **💻 Code Docs**: [Implementation Guide](docs/CODE_DOCUMENTATION.md)

## 🔗 **Additional Links**

- **API Reference**: [API Documentation](http://localhost:8000/docs)
- **Live Demo**: [Local Development Server](http://localhost:5173)
- **GitHub Repository**: [Source Code](https://github.com/your-username/AI_Planet)
