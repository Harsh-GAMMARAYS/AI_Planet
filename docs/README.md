# AI Planet - Documentation

Welcome to the AI Planet documentation! This repository contains comprehensive documentation for the AI Workflow Builder platform.

## 📚 Documentation Index

### 🏗️ **System Design Documents**

| Document | Description | Link |
|----------|-------------|------|
| **High-Level Design (HLD) & Low-Level Design (LLD)** | Complete system architecture and detailed implementation design | [📋 View HLD/LLD](./HLD_LLD_DESIGN.md) |
| **System Architecture** | Technical architecture overview and component design | [🏛️ View Architecture](./ARCHITECTURE.md) |
| **Code Documentation** | Detailed code structure and implementation guide | [💻 View Code Docs](./CODE_DOCUMENTATION.md) |

### 🚀 **Quick Start**

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/AI_Planet.git
   cd AI_Planet
   ```

2. **Start the Application**
   ```bash
   # Start backend
   cd backend
   uv install
   uvicorn main:app --reload
   
   # Start frontend (in new terminal)
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### 📋 **Documentation Structure**

```
docs/
├── README.md                    # This file - Documentation index
├── HLD_LLD_DESIGN.md           # High-Level & Low-Level Design
├── ARCHITECTURE.md             # System Architecture Overview
└── CODE_DOCUMENTATION.md       # Code Implementation Guide
```

### 🎯 **Key Features**

- **Visual Workflow Builder**: Drag-and-drop interface for creating AI workflows
- **Multi-Model AI Integration**: Support for OpenAI GPT and Google Gemini
- **Document Processing**: PDF upload and semantic search capabilities
- **Real-time Chat**: Interactive AI conversations
- **User Authentication**: Secure JWT-based authentication
- **Scalable Architecture**: Built for performance and growth

### 🔧 **Tech Stack**

**Frontend**
- React 18 + TypeScript
- Vite (Build Tool)
- Tailwind CSS (Styling)
- React Flow (Workflow Builder)
- Axios (API Client)

**Backend**
- FastAPI (Python Web Framework)
- PostgreSQL (Primary Database)
- ChromaDB (Vector Database)
- SQLAlchemy (ORM)
- JWT Authentication

**AI Services**
- OpenAI GPT API
- Google Gemini API
- PyMuPDF (Document Processing)

### 📖 **Documentation Sections**

#### **HLD/LLD Design** ([View Full Document](./HLD_LLD_DESIGN.md))
- Executive Summary
- High-Level System Design
- Low-Level Implementation Details
- Database Schema Design
- API Design Patterns
- Security Architecture
- Performance Optimization
- Deployment Strategy
- Testing Strategy
- Scalability Considerations

#### **System Architecture** ([View Full Document](./ARCHITECTURE.md))
- Component Architecture
- Data Flow Patterns
- Integration Architecture
- Security Architecture
- Performance Architecture
- Deployment Architecture
- Testing Architecture
- Scalability Architecture

#### **Code Documentation** ([View Full Document](./CODE_DOCUMENTATION.md))
- Frontend Code Architecture
- Backend Code Architecture
- Data Models and Interfaces
- Service Layer Implementation
- UI/UX Design Patterns
- Security Implementation
- Performance Optimizations
- Development Workflow

### 🎓 **Assignment Submission**

This documentation is designed for **Full-Stack Engineering Internship Assignment** submission and includes:

✅ **Complete Source Code** - Fully functional AI workflow platform  
✅ **Professional Documentation** - HLD/LLD, Architecture, and Code docs  
✅ **System Design** - Comprehensive technical design  
✅ **Implementation Guide** - Detailed code documentation  
✅ **Deployment Ready** - Docker and production setup  

### 🔗 **Quick Links**

- **Main README**: [../README.md](../README.md)
- **Frontend Code**: [../frontend/](../frontend/)
- **Backend Code**: [../backend/](../backend/)
- **Docker Setup**: [../docker-compose.yml](../docker-compose.yml)

### 📞 **Support**

For questions or issues:
- Create an issue in the GitHub repository
- Check the [Main README](../README.md) for setup instructions
- Review the [Code Documentation](./CODE_DOCUMENTATION.md) for implementation details

---

**Document Version**: 1.0  
**Last Updated**: September 2024  
**Next Review**: October 2024
