import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Globe, Trash2 } from 'lucide-react';

interface WebSearchNodeData {
  label?: string;
  searchProvider?: string;
  serpApiKey?: string;
  numResults?: number;
}

interface WebSearchNodeProps {
  data: WebSearchNodeData;
  id: string;
  selected?: boolean;
}

export const WebSearchNode: React.FC<WebSearchNodeProps> = ({ data, id, selected }) => {
  const [searchProvider, setSearchProvider] = useState(data.searchProvider || 'DuckDuckGo (Free)');
  const [serpApiKey, setSerpApiKey] = useState(data.serpApiKey || '');
  const [numResults, setNumResults] = useState(data.numResults || 5);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('deleteNode', {
      detail: { nodeId: id }
    }));
  };

  const requiresApiKey = searchProvider.includes('SerpAPI');

  return (
    <div className={`bg-white border-2 border-cyan-500 rounded-xl min-w-[280px] shadow-lg font-inherit ${selected ? 'border-cyan-500 shadow-cyan-100' : 'border-slate-200'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
      
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl">
        <Globe className="w-4 h-4 text-orange-500" />
        <span className="flex-1 font-semibold text-slate-800 text-sm">Web Search</span>
        <button 
          className="bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 text-xs text-red-400 hover:bg-red-50 hover:text-red-500"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-slate-500 text-xs mb-4">Configure web search settings</div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Search Provider</label>
          <select 
            value={searchProvider}
            onChange={(e) => setSearchProvider(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-700 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="DuckDuckGo (Free)">DuckDuckGo (Free)</option>
            <option value="SerpAPI (Paid)">SerpAPI (Paid)</option>
          </select>
        </div>

        {requiresApiKey && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-700 mb-2">SerpAPI Key</label>
            <input
              type="password"
              value={serpApiKey}
              onChange={(e) => setSerpApiKey(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-700 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        )}

        {!requiresApiKey && (
          <div className="mb-3 p-2 bg-emerald-50 border border-emerald-200 rounded-md">
            <div className="text-xs text-emerald-700">
              ✅ No API key required - using free DuckDuckGo search
            </div>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Number of Results</label>
          <input
            type="number"
            min="1"
            max="10"
            value={numResults}
            onChange={(e) => setNumResults(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-700 transition-all duration-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="px-4 py-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 bg-slate-50 rounded-b-xl">
        <span className="text-amber-500">Query</span>
        <span className="text-emerald-500">Results</span>
      </div>

      <Handle type="source" position={Position.Right} className="w-3 h-3 bg-emerald-500 border-2 border-white" />
    </div>
  );
};
