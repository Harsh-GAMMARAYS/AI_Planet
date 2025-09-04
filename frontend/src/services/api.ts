const API_BASE_URL = 'http://localhost:8000/api';

export interface ChatRequest {
  message: string;
  use_knowledge_base: boolean;
  use_web_search: boolean;
  workflow_context?: {
    user_query?: string;
    custom_prompt?: string;
    output_data?: string;
  };
}

export interface ChatExecutionResponse {
  message: string;
  response: string;
  sources_used: {
    knowledge_base: boolean;
    web_search: boolean;
  };
}

export interface WorkflowRequest {
  user_query: string;
  use_knowledge_base: boolean;
  use_web_search: boolean;
  custom_prompt?: string;
}

export interface WorkflowExecutionResponse {
  query: string;
  response: string;
  used_knowledge_base: boolean;
  used_web_search: boolean;
  knowledge_base_results: number;
  web_search_results: number;
}

export interface AuthRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
}

// New Stack and Workflow interfaces
export interface StackCreate {
  name: string;
  description?: string;
}

export interface StackResponse {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  workflows?: WorkflowResponse[];
  chats?: ChatResponse[];
}

export interface WorkflowCreate {
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  node_configs?: Record<string, any>;
}

export interface WorkflowResponse {
  id: string;
  name: string;
  description?: string;
  nodes?: any[];
  edges?: any[];
  node_configs?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ChatCreate {
  title?: string;
  context_snapshot?: Record<string, any>;
}

export interface MessageResponse {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

export interface ChatResponse {
  id: string;
  title?: string;
  context_snapshot?: Record<string, any>;
  created_at: string;
  updated_at: string;
  messages?: MessageResponse[];
}

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: this.getAuthHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async register(request: RegisterRequest): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async login(request: AuthRequest): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getCurrentUser(): Promise<UserResponse> {
    return this.request<UserResponse>('/auth/me');
  }

  // Stack Management
  async createStack(request: StackCreate): Promise<StackResponse> {
    return this.request<StackResponse>('/stacks/', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getUserStacks(): Promise<StackResponse[]> {
    return this.request<StackResponse[]>('/stacks/');
  }

  async getStack(stackId: string): Promise<StackResponse> {
    return this.request<StackResponse>(`/stacks/${stackId}`);
  }

  async deleteStack(stackId: string): Promise<void> {
    return this.request(`/stacks/${stackId}`, {
      method: 'DELETE',
    });
  }

  // Workflow Management
  async createWorkflow(stackId: string, request: WorkflowCreate): Promise<WorkflowResponse> {
    return this.request<WorkflowResponse>(`/stacks/${stackId}/workflows`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateWorkflow(stackId: string, workflowId: string, request: WorkflowCreate): Promise<WorkflowResponse> {
    return this.request<WorkflowResponse>(`/stacks/${stackId}/workflows/${workflowId}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  // Chat Management
  async createChat(stackId: string, request: ChatCreate): Promise<ChatResponse> {
    return this.request<ChatResponse>(`/stacks/${stackId}/chats`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async addMessage(chatId: string, request: any): Promise<any> {
    return this.request(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Chat with the AI stack
  async chatWithStack(request: ChatRequest): Promise<ChatExecutionResponse> {
    return this.request<ChatExecutionResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Run a complete workflow
  async runWorkflow(request: WorkflowRequest): Promise<WorkflowResponse> {
    return this.request<WorkflowResponse>('/run-workflow', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Upload document for knowledge base
  async uploadDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/upload-doc`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Document upload failed:', error);
      throw error;
    }
  }

  // Embed document into knowledge base
  async embedDocument(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}/embed-doc`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Document embedding failed:', error);
      throw error;
    }
  }

  // Search knowledge base
  async searchKnowledgeBase(query: string, nResults: number = 3): Promise<any> {
    const params = new URLSearchParams({
      query,
      n_results: nResults.toString(),
    });

    return this.request(`/search?${params}`);
  }

  // Web search
  async webSearch(query: string, numResults: number = 5): Promise<any> {
    const params = new URLSearchParams({
      query,
      num_results: numResults.toString(),
    });

    return this.request(`/web-search?${params}`);
  }

  // Health check
  async ping(): Promise<any> {
    return this.request('/ping');
  }
}

export const apiService = new ApiService();
