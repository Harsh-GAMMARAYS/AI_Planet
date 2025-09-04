import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Sparkles, Trash2 } from 'lucide-react';

interface LLMEngineNodeData {
  label?: string;
  model?: string;
  apiKey?: string;
  prompt?: string;
  temperature?: number;
  webSearchEnabled?: boolean;
  serpApiKey?: string;
  nodeConfigs?: Record<string, any>;
}

interface LLMEngineNodeProps {
  data: LLMEngineNodeData;
  id: string;
  selected?: boolean;
}

export const LLMEngineNode: React.FC<LLMEngineNodeProps> = ({ data, id, selected }) => {
  const nodeConfigs = data.nodeConfigs || {};
  const nodeConfig = nodeConfigs[id] || {};
  
  // Initialize state from config or defaults
  const initialModel = nodeConfig.model || data.model || 'Gemini 2.0 Flash (Free)';
  const initialApiKey = nodeConfig.apiKey || data.apiKey || '';
  const initialPrompt = nodeConfig.prompt || data.prompt || 'You are a helpful AI assistant. Use the context provided to answer the user\'s query accurately and comprehensively.';
  const initialTemperature = nodeConfig.temperature || data.temperature || 0.75;
  const initialWebSearchEnabled = nodeConfig.webSearchEnabled !== undefined ? nodeConfig.webSearchEnabled : (data.webSearchEnabled !== undefined ? data.webSearchEnabled : true);
  
  const [model, setModel] = useState(initialModel);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [temperature, setTemperature] = useState(initialTemperature);
  const [webSearchEnabled, setWebSearchEnabled] = useState<boolean>(initialWebSearchEnabled);
  
  const debounceTimerRef = useRef<number | null>(null);

  // Update state when config changes from parent
  useEffect(() => {
    if (nodeConfig.model !== undefined && nodeConfig.model !== model) {
      setModel(nodeConfig.model);
    }
    if (nodeConfig.apiKey !== undefined && nodeConfig.apiKey !== apiKey) {
      setApiKey(nodeConfig.apiKey);
    }
    if (nodeConfig.prompt !== undefined && nodeConfig.prompt !== prompt) {
      setPrompt(nodeConfig.prompt);
    }
    if (nodeConfig.temperature !== undefined && nodeConfig.temperature !== temperature) {
      setTemperature(nodeConfig.temperature);
    }
    if (nodeConfig.webSearchEnabled !== undefined && nodeConfig.webSearchEnabled !== webSearchEnabled) {
      setWebSearchEnabled(nodeConfig.webSearchEnabled);
    }
  }, [nodeConfig.model, nodeConfig.apiKey, nodeConfig.prompt, nodeConfig.temperature, nodeConfig.webSearchEnabled]);

  // Handle model change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    setModel(newValue);
    
    // Update parent config
    window.dispatchEvent(new CustomEvent('updateNodeConfig', {
      detail: { 
        nodeId: id, 
        key: 'model', 
        value: newValue 
      }
    }));
  };

  // Handle API key change
  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setApiKey(newValue);
    
    // Update parent config
    window.dispatchEvent(new CustomEvent('updateNodeConfig', {
      detail: { 
        nodeId: id, 
        key: 'apiKey', 
        value: newValue 
      }
    }));
  };

  // Handle prompt change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setPrompt(newValue);
    
    console.log('🔍 LLM Prompt Changed:', { nodeId: id, value: newValue });
    
    // Clear previous timer
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce the update to avoid too many events
    debounceTimerRef.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('updateNodeConfig', {
        detail: { 
          nodeId: id, 
          key: 'prompt', 
          value: newValue 
        }
      }));
    }, 300);
  };

  // Handle temperature change
  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    setTemperature(newValue);
    
    // Update parent config
    window.dispatchEvent(new CustomEvent('updateNodeConfig', {
      detail: { 
        nodeId: id, 
        key: 'temperature', 
        value: newValue 
      }
    }));
  };

  // Handle web search toggle
  const handleWebSearchToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setWebSearchEnabled(newValue);
    
    // Update parent config
    window.dispatchEvent(new CustomEvent('updateNodeConfig', {
      detail: { 
        nodeId: id, 
        key: 'webSearchEnabled', 
        value: newValue 
      }
    }));
  };

  // Handle delete node
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('deleteNode', {
      detail: { nodeId: id }
    }));
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const requiresApiKey = !model.includes('Free');

  return (
    <div className={`bg-white border-2 border-purple-500 rounded-xl min-w-[280px] shadow-lg font-inherit ${selected ? 'border-purple-500 shadow-purple-100' : 'border-slate-200'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
      
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="flex-1 font-semibold text-slate-800 text-sm">LLM Engine</span>
        <button 
          className="bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 text-xs text-red-400 hover:bg-red-50 hover:text-red-500"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-slate-500 text-xs mb-4">Configure your LLM settings</div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Model</label>
          <select 
            value={model}
            onChange={handleModelChange}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-700 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="Gemini 2.0 Flash (Free)">Gemini 2.0 Flash (Free)</option>
            <option value="GPT 4o - Mini">GPT 4o - Mini</option>
            <option value="GPT 4o">GPT 4o</option>
            <option value="GPT 3.5 Turbo">GPT 3.5 Turbo</option>
          </select>
        </div>

        {requiresApiKey && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-700 mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="••••••••••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-700 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}

        {!requiresApiKey && (
          <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
            <div className="text-xs text-emerald-700">
              ✅ No API key required - using free tier
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder="You are a helpful AI assistant. Use the context provided to answer the user's query accurately and comprehensively."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-vertical font-inherit text-slate-700 bg-white transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
            rows={3}
          />
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Temperature</label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={temperature}
              onChange={handleTemperatureChange}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-slate-600 min-w-[2rem]">{temperature}</span>
          </div>
        </div>

        <div className="mb-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={webSearchEnabled}
              onChange={handleWebSearchToggle}
              className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
            />
            Enable Web Search (Free)
          </label>
        </div>

        {webSearchEnabled && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-xs text-blue-700">
              ✅ Using free DuckDuckGo search - no API key needed
            </div>
          </div>
        )}
      </div>
      
      <div className="px-4 py-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 bg-slate-50 rounded-b-xl">
        <span className="text-amber-500">Input</span>
        <span className="text-emerald-500">Output</span>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
    </div>
  );
};
