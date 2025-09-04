import { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/workflow/Canvas';
import { ChatModal } from './components/chat/ChatModal';
import { LoginModal } from './components/auth/LoginModal';
import { Dashboard } from './components/dashboard/Dashboard';
import { FileText, Sparkles, BookOpen, Globe, FileDown } from 'lucide-react';
import { apiService } from './services/api';
import type { MessageResponse } from './services/api';

interface WorkflowData {
  nodes: any[];
  edges: any[];
  nodeConfigs?: Record<string, any>;
}

interface ChatData {
  history: any[];
  messages: any[];
  currentId: string | null;
}

interface AppState {
  currentView: 'dashboard' | 'workflow';
  isAuthenticated: boolean;
  showLoginModal: boolean;
  showChatModal: boolean;
  user: any;
  authChecked: boolean;
  selectedComponent: string | null;
  currentStackId: string | null;
  currentWorkflowId: string | null;
  workflowData: WorkflowData;
  chatData: ChatData;
  workflowResult: { success: boolean; message: string; response?: any } | null;
  outputNodeData: string;
}

function App() {
  const [state, setState] = useState<AppState>({
    currentView: 'dashboard',
    isAuthenticated: false,
    showLoginModal: false,
    showChatModal: false,
    user: null,
    authChecked: false,
    selectedComponent: null,
    currentStackId: null,
    currentWorkflowId: null,
    workflowData: { nodes: [], edges: [] },
    chatData: { history: [], messages: [], currentId: null },
    workflowResult: null,
    outputNodeData: ''
  });

  const components = [
    { id: 'user-query', name: 'User Query', icon: <FileText className="w-5 h-5" /> },
    { id: 'llm-openai', name: 'LLM Engine', icon: <Sparkles className="w-5 h-5" /> },
    { id: 'knowledge-base', name: 'Knowledge Base', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'web-search', name: 'Web Search', icon: <Globe className="w-5 h-5" /> },
    { id: 'output', name: 'Output', icon: <FileDown className="w-5 h-5" /> },
  ];

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    checkAuth();
    apiService.ping().catch(console.error);
  }, []);

  useEffect(() => {
    if (!state.isAuthenticated && !state.showLoginModal && state.authChecked) {
      updateState({ showLoginModal: true });
    }
  }, [state.isAuthenticated, state.showLoginModal, state.authChecked]);

  const checkAuth = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const userData = await apiService.getCurrentUser();
        updateState({ user: userData, isAuthenticated: true });
        console.log('✅ User authenticated:', userData.email);
      } catch (error) {
        console.log('❌ Token invalid, removing from localStorage');
        localStorage.removeItem('authToken');
        updateState({ isAuthenticated: false, user: null });
      }
    } else {
      console.log('❌ No token found in localStorage');
      updateState({ isAuthenticated: false, user: null });
    }
    updateState({ authChecked: true });
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      localStorage.setItem('authToken', response.access_token);
      await checkAuth();
      updateState({ showLoginModal: false });
    } catch (error: any) {
      throw error;
    }
  };

  const handleRegister = async (username: string, email: string, password: string) => {
    try {
      await apiService.register({ username, email, password });
      const loginResponse = await apiService.login({ email, password });
      localStorage.setItem('authToken', loginResponse.access_token);
      await checkAuth();
      updateState({ showLoginModal: false });
    } catch (error: any) {
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    updateState({
      isAuthenticated: false,
      user: null,
      currentView: 'dashboard',
      currentStackId: null,
      currentWorkflowId: null
    });
  };

  const handleCreateWorkflow = async () => {
    if (!state.isAuthenticated) {
      updateState({ showLoginModal: true });
      return;
    }
    
    try {
      const response = await apiService.createStack({ name: 'New Stack' });
      console.log('📦 Created new stack:', response);
      
      // Reset all workflow data and set new stack ID
      updateState({
        currentStackId: response.id,
        currentWorkflowId: null,
        workflowData: { 
          nodes: [], 
          edges: [], 
          nodeConfigs: {} 
        },
        chatData: { history: [], messages: [], currentId: null },
        currentView: 'workflow'
      });
      

    } catch (error) {
      console.error('❌ Error creating stack:', error);
    }
  };

  const handleOpenWorkflow = async (stackId: string) => {
    if (!state.isAuthenticated) {
      updateState({ showLoginModal: true });
      return;
    }
    try {
      updateState({ currentStackId: stackId, currentWorkflowId: null, currentView: 'workflow' });
      
      const stack = await apiService.getStack(stackId);
      console.log('📦 Loaded stack data:', {
        id: stack.id,
        name: stack.name,
        workflows: stack.workflows?.length || 0,
        chats: stack.chats?.length || 0
      });
      
      // Only load workflow data if there are existing workflows
      if (stack.workflows && stack.workflows.length > 0) {
        const workflow = stack.workflows[0];
        updateState({ currentWorkflowId: workflow.id });
        
        const workflowData = {
          nodes: workflow.nodes || [],
          edges: workflow.edges || [],
          nodeConfigs: workflow.node_configs || {}
        };
        updateState({ workflowData });
        
        console.log('✅ Loaded workflow:', {
          id: workflow.id,
          nodes: workflow.nodes?.length || 0,
          edges: workflow.edges?.length || 0,
          nodeConfigs: Object.keys(workflow.node_configs || {}).length,
          edgesData: workflow.edges
        });
      } else {
        // For new stacks, start with empty workflow data
        updateState({ 
          workflowData: { 
            nodes: [], 
            edges: [], 
            nodeConfigs: {} 
          }
        });
        console.log('🆕 New stack - starting with empty workflow');
      }
      
      if (stack.chats && stack.chats.length > 0) {
        const mostRecentChat = stack.chats[0];
        const chatMessages = mostRecentChat.messages?.map((msg: any) => ({
          id: msg.id,
          text: msg.content,
          sender: msg.role === 'user' ? 'user' : 'ai',
          timestamp: new Date(msg.created_at),
        })) || [];
        
        updateState({
          chatData: {
            history: stack.chats,
            messages: chatMessages,
            currentId: mostRecentChat.id
          }
        });
        
        console.log('💬 Loaded chat history:', stack.chats.length, 'chats');
      } else {
        updateState({
          chatData: { history: [], messages: [], currentId: null }
        });
      }
    } catch (error) {
      console.error('❌ Error loading stack:', error);
    }
  };

  const handleSaveWorkflow = async (workflowData?: { nodes: any[]; edges: any[] }) => {
    if (!state.currentStackId) {
      console.error('No stack selected');
      return;
    }
    
    try {
      const nodes = workflowData?.nodes || [];
      const edges = workflowData?.edges || [];
      const nodeConfigs = state.workflowData.nodeConfigs || {};

      updateState({ workflowData: { nodes, edges, nodeConfigs } });

      const saveData = {
        name: 'My Workflow',
        description: 'AI workflow for processing queries',
        nodes,
        edges,
        node_configs: nodeConfigs
      };

      console.log('💾 Auto-saving workflow:', { nodes: nodes.length, edges: edges.length, configs: Object.keys(nodeConfigs) });
      console.log('💾 Edges data:', edges);

      if (state.currentWorkflowId) {
        await apiService.updateWorkflow(state.currentStackId, state.currentWorkflowId, saveData);
      } else {
        const newWorkflow = await apiService.createWorkflow(state.currentStackId, saveData);
        updateState({ currentWorkflowId: newWorkflow.id });
      }
    } catch (error) {
      console.error('❌ Error saving workflow:', error);
    }
  };

  const handleComponentSelect = (componentId: string) => {
    updateState({ selectedComponent: componentId });
  };

  const handleNodeSelect = (_nodeId: string, nodeType: string) => {
    updateState({ selectedComponent: nodeType });
  };

  const handleChatOpen = (workflowData?: { nodes: any[]; edges: any[] }) => {
    if (workflowData) {
      updateState({ workflowData: { ...workflowData, nodeConfigs: state.workflowData.nodeConfigs } });
    }
    updateState({ showChatModal: true });
  };

  const handleChatClose = () => {
    updateState({ showChatModal: false });
  };

  const handleChatHistoryUpdate = async () => {
    if (state.currentStackId) {
      try {
        const stack = await apiService.getStack(state.currentStackId);
        if (stack.chats && stack.chats.length > 0) {
          const mostRecentChat = stack.chats[0];
          const chatMessages = mostRecentChat.messages?.map((msg: MessageResponse) => ({
            id: msg.id,
            text: msg.content,
            sender: msg.role === 'user' ? 'user' : 'ai',
            timestamp: new Date(msg.created_at),
          })) || [];
          
          updateState({
            chatData: {
              history: stack.chats,
              messages: chatMessages,
              currentId: mostRecentChat.id
            }
          });
          
          console.log('💬 Updated chat history:', stack.chats.length, 'chats');
        }
      } catch (error) {
        console.error('Failed to update chat history:', error);
      }
    }
  };

  const handleNodeConfigUpdate = (nodeId: string, key: string, value: any) => {
    console.log('🔍 App received node config update:', { nodeId, key, value });
    
    // Only update if the value actually changed
    const currentValue = state.workflowData.nodeConfigs?.[nodeId]?.[key];
    if (currentValue === value) {
      return; // No change needed
    }
    
    const newConfigs = {
      ...state.workflowData.nodeConfigs,
      [nodeId]: {
        ...state.workflowData.nodeConfigs?.[nodeId],
        [key]: value
      }
    };
    
    updateState({ 
      workflowData: { 
        ...state.workflowData, 
        nodeConfigs: newConfigs 
      } 
    });
  };



  const getCurrentWorkflowData = () => {
    // Get the current nodes and edges from the Canvas component
    // This ensures we're using the actual React Flow state
    return {
      nodes: state.workflowData.nodes,
      edges: state.workflowData.edges,
      nodeConfigs: state.workflowData.nodeConfigs
    };
  };

  const handleBuildStack = async (isValid: boolean, errors: string[], workflowData?: { nodes: any[]; edges: any[] }) => {
    if (isValid) {
      try {
        if (workflowData && state.currentStackId) {
          await handleSaveWorkflow(workflowData);
        }
        
        updateState({ workflowResult: { success: false, message: 'Executing workflow...' } });
        
        const nodes = workflowData?.nodes || [];
        const edges = workflowData?.edges || [];
        
        const userQueryNode = nodes.find(node => node.type === 'user-query');
        if (!userQueryNode) {
          throw new Error('No User Query node found');
        }
        
        const userQuery = state.workflowData.nodeConfigs?.[userQueryNode.id]?.currentQuery || userQueryNode?.data?.config?.currentQuery || userQueryNode?.data?.currentQuery || 'Hello, how can you help me?';
        
        const llmNode = nodes.find(node => node.type === 'llm-openai');
        const knowledgeBaseNode = nodes.find(node => node.type === 'knowledge-base');
        const webSearchNode = nodes.find(node => node.type === 'web-search');
        
        const customPrompt = state.workflowData.nodeConfigs?.[llmNode?.id]?.prompt || llmNode?.data?.config?.prompt || llmNode?.data?.prompt || 'You are a helpful AI assistant.';
        
        const useKnowledgeBase = !!knowledgeBaseNode;
        const useWebSearch = !!webSearchNode;
        
        const workflowRequest = {
          user_query: userQuery,
          use_knowledge_base: useKnowledgeBase,
          use_web_search: useWebSearch,
          custom_prompt: customPrompt
        };
        
        console.log('🔍 Workflow Request:', {
          userQuery,
          useKnowledgeBase,
          useWebSearch,
          customPrompt,
          nodes: nodes.map(n => ({ id: n.id, type: n.type })),
          edges: edges.map(e => ({ source: e.source, target: e.target }))
        });
        
        const response = await apiService.runWorkflow(workflowRequest);
        console.log('Workflow executed:', response);
        
        const responseText = (response as any).response || JSON.stringify(response, null, 2);
        updateState({
          workflowResult: { success: true, message: 'Workflow executed successfully!', response },
          outputNodeData: responseText
        });
        
        setTimeout(() => updateState({ workflowResult: null }), 5000);
      } catch (error) {
        console.error('Workflow execution failed:', error);
        updateState({
          workflowResult: { 
            success: false, 
            message: `Workflow execution failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
          }
        });
        
        setTimeout(() => updateState({ workflowResult: null }), 8000);
      }
    } else {
      updateState({
        workflowResult: { success: false, message: `Workflow validation failed:\n${errors.join('\n')}` }
      });
      
      setTimeout(() => updateState({ workflowResult: null }), 8000);
    }
  };

  // Render different views based on current state
  if (state.currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-white">
        {state.isAuthenticated ? (
          <Dashboard
            onLogout={handleLogout}
            onOpenWorkflow={handleOpenWorkflow}
            onCreateWorkflow={handleCreateWorkflow}
          />
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-emerald-600 mb-4">AI Planet</h1>
              <p className="text-slate-600 mb-8">Welcome to your AI workflow platform</p>
            </div>
          </div>
        )}
        
        {state.showLoginModal && (
          <LoginModal
            isOpen={state.showLoginModal}
            onClose={() => updateState({ showLoginModal: false })}
            onLogin={handleLogin}
            onRegister={handleRegister}
          />
        )}
      </div>
    );
  }

  if (state.currentView === 'workflow') {
    return (
      <div className="h-screen w-screen flex flex-col bg-white">
        <Header onSave={() => handleSaveWorkflow(getCurrentWorkflowData())} onBack={() => updateState({ currentView: 'dashboard' })} />
        
        <div className="flex-1 flex w-full h-[calc(100vh-60px)] overflow-hidden">
          <Sidebar 
            components={components}
            onComponentSelect={handleComponentSelect} 
            onChatOpen={() => handleChatOpen(getCurrentWorkflowData())} 
          />
          
          <Canvas 
            key={`canvas-${state.currentWorkflowId || 'new'}`}
            onChatWithStack={handleChatOpen}
            nodeConfigs={state.workflowData.nodeConfigs || {}}
            onNodeSelect={handleNodeSelect}
            onNodeConfigUpdate={handleNodeConfigUpdate}
            onBuildStack={handleBuildStack}
            onSaveWorkflow={handleSaveWorkflow}
            outputNodeData={state.outputNodeData}
            initialWorkflowData={state.workflowData}
          />
        </div>

        {state.showChatModal && (
          <ChatModal
            isOpen={state.showChatModal}
            onClose={handleChatClose}
            workflowData={{ 
              nodes: state.workflowData.nodes, 
              edges: state.workflowData.edges, 
              nodeConfigs: state.workflowData.nodeConfigs || {},
              outputData: state.outputNodeData 
            }}
            chatHistory={state.chatData.history}
            stackId={state.currentStackId || undefined}
            onChatHistoryUpdate={handleChatHistoryUpdate}
            messages={state.chatData.messages}
            setMessages={(messages) => updateState({ chatData: { ...state.chatData, messages: Array.isArray(messages) ? messages : [messages] } })}
            currentChatId={state.chatData.currentId}
            setCurrentChatId={(id) => updateState({ chatData: { ...state.chatData, currentId: id } })}
          />
        )}
      </div>
    );
  }

  return null;
}

export default App;