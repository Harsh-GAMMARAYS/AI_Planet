import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import type { ChatRequest } from '../../services/api';
import { X, Bot, User, Send, Trash2, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isLoading?: boolean;
}

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowData?: {
    nodes: any[];
    edges: any[];
    nodeConfigs: Record<string, any>;
    outputData?: string;
  };
  chatHistory?: any[];
  stackId?: string;
  onChatHistoryUpdate?: () => void;
  messages: any[];
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, workflowData, stackId, onChatHistoryUpdate, messages, setMessages, currentChatId, setCurrentChatId }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Initialize chat with workflow output if available
  useEffect(() => {
    if (isOpen && workflowData?.outputData && messages.length === 0) {
      const initialMessage: Message = {
        id: 'workflow-output',
        text: `Here's the output from your workflow:\n\n${workflowData.outputData}\n\nYou can now continue the conversation with me about this topic or ask follow-up questions.`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, workflowData?.outputData, messages.length]);

  // Chat messages are now managed by parent component

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev: any[]) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add loading message
    const loadingMessage: Message = {
      id: 'loading-' + Date.now(),
      text: '',
      sender: 'ai',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev: any[]) => [...prev, loadingMessage]);

    try {
      // Determine if we should use knowledge base and web search based on workflow
      const useKnowledgeBase = workflowData?.nodes.some(node => node.type === 'knowledge-base') || false;
      const useWebSearch = workflowData?.nodes.some(node => node.type === 'web-search') || false;

      // Get workflow context
      const userQueryNode = workflowData?.nodes.find(node => node.type === 'user-query');
      const llmNode = workflowData?.nodes.find(node => node.type === 'llm-openai');
      
      const userQuery = userQueryNode ? 
        (workflowData?.nodeConfigs[userQueryNode.id]?.currentQuery || userQueryNode?.data?.config?.currentQuery) : 
        undefined;
      
      const customPrompt = llmNode ? 
        (workflowData?.nodeConfigs[llmNode.id]?.prompt || llmNode?.data?.config?.prompt) : 
        undefined;

      const chatRequest: ChatRequest = {
        message: userMessage.text,
        use_knowledge_base: useKnowledgeBase,
        use_web_search: useWebSearch,
        workflow_context: {
          user_query: userQuery,
          custom_prompt: customPrompt,
          output_data: workflowData?.outputData
        }
      };

      const response = await apiService.chatWithStack(chatRequest);
      
      const aiResponse: Message = {
        id: Date.now().toString(),
        text: response.response,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev: any[]) => prev.filter((msg: any) => !msg.isLoading).concat(aiResponse));

      // Auto-save messages to database if stackId is available
      if (stackId) {
        try {
          // Create chat if it doesn't exist
          if (!currentChatId) {
            const chat = await apiService.createChat(stackId, {
              title: `Chat - ${new Date().toLocaleString()}`,
              context_snapshot: workflowData
            });
            setCurrentChatId(chat.id);
          }

          // Save user message
          if (currentChatId) {
            await apiService.addMessage(currentChatId, {
              role: 'user',
              content: userMessage.text
            });

            // Save AI response
            await apiService.addMessage(currentChatId, {
              role: 'assistant',
              content: response.response,
              model: 'gemini-2.0-flash',
              used_knowledge_base: useKnowledgeBase,
              used_web_search: useWebSearch
            });
          }
          
          // Auto-refresh chat history
          if (onChatHistoryUpdate) {
            onChatHistoryUpdate();
          }
        } catch (error) {
          console.error('Failed to save chat messages:', error);
        }
      }
    } catch (error) {
      console.error('Chat API error:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: 'Sorry, I encountered an error connecting to the backend. Please make sure the backend server is running.',
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev: any[]) => prev.filter((msg: any) => !msg.isLoading).concat(errorMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentChatId(null);
  };

  // Don't reset chat when modal closes - preserve chat history

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[1000] backdrop-blur-sm" onClick={onClose}>
            <div className="w-[98%] max-w-[1200px] h-[95%] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white">
          <div className="flex items-center gap-2 font-semibold text-slate-700 text-base">
            <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-white font-bold text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <span>GenAI Stack Chat</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button 
                className="bg-transparent border-none cursor-pointer text-slate-500 p-2 rounded-md transition-all duration-200 font-medium hover:bg-slate-100 hover:text-slate-700"
                onClick={clearChat}
                title="Clear Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button 
              className="bg-transparent border-none text-xl cursor-pointer text-slate-500 p-2 rounded-md transition-all duration-200 font-medium hover:bg-slate-100 hover:text-slate-700"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Body - Chat Area */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center py-8">
                <div className="flex items-center justify-center gap-3 font-semibold text-slate-800 mb-2 text-lg">
                  <div className="w-7 h-7 bg-emerald-500 rounded-md flex items-center justify-center text-white font-bold text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <span>GenAI Stack Chat</span>
                </div>
                <p>Start a conversation to test your stack</p>
                {workflowData && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
                    <p className="flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Workflow: {workflowData.nodes.length} components connected
                    </p>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 items-start ${message.sender === 'user' ? 'justify-start' : 'justify-start'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0 ${message.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`max-w-[70%] px-4 py-3 rounded-xl relative ${message.sender === 'user' ? 'bg-blue-500 text-white rounded-bl-md' : 'bg-slate-50 text-slate-800 rounded-bl-md max-w-[80%]'}`}>
                    {message.isLoading ? (
                      <div className="flex gap-1 items-center py-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" style={{animationDelay: '0.2s'}}></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" style={{animationDelay: '0.4s'}}></span>
                      </div>
                    ) : (
                      <div className="leading-relaxed mb-2 text-sm prose prose-slate max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                      </div>
                    )}
                    <div className={`text-xs opacity-70 text-right ${message.sender === 'user' ? 'text-blue-100' : 'text-slate-500'}`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Footer - Input Area */}
          <div className="px-6 py-4 border-t border-slate-200 flex gap-3 items-center bg-white">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Send a message"
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 bg-white text-slate-700 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500 placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button 
              className={`px-4 py-3 bg-emerald-500 text-white border-none rounded-lg cursor-pointer text-base transition-all duration-200 min-w-11 flex items-center justify-center ${isLoading ? 'bg-slate-400 cursor-not-allowed' : 'hover:bg-emerald-600'} ${!inputValue.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={sendMessage}
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
