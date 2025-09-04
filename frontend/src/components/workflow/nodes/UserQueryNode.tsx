import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, Trash2, X } from 'lucide-react';

interface UserQueryNodeData {
  label?: string;
  query?: string;
  config?: {
    placeholder?: string;
    defaultQuery?: string;
    currentQuery?: string;
  };
  nodeConfigs?: Record<string, any>;
}

interface UserQueryNodeProps {
  data: UserQueryNodeData;
  id: string;
  selected?: boolean;
}

export const UserQueryNode: React.FC<UserQueryNodeProps> = ({ data, id, selected }) => {
  const config = data.config || {};
  const nodeConfigs = data.nodeConfigs || {};
  const nodeConfig = nodeConfigs[id] || {};
  const [query, setQuery] = useState('');
  const debounceTimerRef = useRef<number | null>(null);

  // Update query when config changes (only if different)
  useEffect(() => {
    const currentQuery = nodeConfig.currentQuery || config.currentQuery;
    if (currentQuery !== undefined && currentQuery !== query) {
      setQuery(currentQuery);
    }
  }, [nodeConfig.currentQuery, config.currentQuery, query]);

  // Handle clearing the textarea properly
  const handleQueryChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    
    console.log('🔍 User Query Changed:', { nodeId: id, value: newValue });
    
    // Debounce config updates to avoid spamming
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('updateNodeConfig', {
        detail: { 
          nodeId: id, 
          key: 'currentQuery', 
          value: newValue 
        }
      }));
    }, 300);
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    // If the content matches the placeholder, clear it
    const placeholder = config.placeholder || "Write your query here";
    if (e.target.value === placeholder) {
      setQuery('');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Trigger delete event
    window.dispatchEvent(new CustomEvent('deleteNode', {
      detail: { nodeId: id }
    }));
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={`bg-white border-2 border-blue-500 rounded-xl min-w-[280px] shadow-lg font-inherit ${selected ? 'border-blue-500 shadow-blue-100' : 'border-slate-200'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
      
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl">
        <FileText className="w-4 h-4 text-blue-500" />
        <span className="flex-1 font-semibold text-slate-800 text-sm">User Query</span>
        <button 
          className="bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 text-xs text-red-400 hover:bg-red-50 hover:text-red-500"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-slate-500 text-xs mb-4">Enter your question or query</div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Query</label>
          <div className="relative">
            <textarea
              value={query}
              onChange={handleQueryChange}
              onFocus={handleFocus}
              placeholder="Write your query here..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm resize-vertical font-inherit text-slate-700 bg-white transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-400"
              rows={3}
            />
            {query && (
              <button 
                className="absolute top-2 right-2 bg-slate-100 border-none rounded w-5 h-5 flex items-center justify-center cursor-pointer text-xs text-slate-500 transition-all duration-200 hover:bg-slate-200 hover:text-slate-700"
                onClick={() => setQuery('')}
                type="button"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="px-4 py-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 bg-slate-50 rounded-b-xl">
        <span className="text-amber-500">Input</span>
        <span className="text-emerald-500">Output</span>
      </div>
      
      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
    </div>
  );
};
