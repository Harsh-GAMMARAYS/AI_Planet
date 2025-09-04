import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileDown, Trash2, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface OutputNodeData {
  label?: string;
  outputText?: string;
  onOpenChat?: () => void;
}

interface OutputNodeProps {
  data: OutputNodeData;
  id: string;
  selected?: boolean;
}

export const OutputNode: React.FC<OutputNodeProps> = ({ data, id, selected }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent('deleteNode', {
      detail: { nodeId: id }
    }));
  };

  return (
    <div className={`bg-white border-2 border-red-500 rounded-xl min-w-[280px] shadow-lg font-inherit ${selected ? 'border-red-500 shadow-red-100' : 'border-slate-200'}`}>
      <Handle type="target" position={Position.Left} className="w-3 h-3 bg-amber-500 border-2 border-white" />
      
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50 rounded-t-xl">
        <FileDown className="w-4 h-4 text-emerald-500" />
        <span className="flex-1 font-semibold text-slate-800 text-sm">Output</span>
        <button 
          className="bg-transparent border-none cursor-pointer p-1 rounded transition-all duration-200 text-xs text-red-400 hover:bg-red-50 hover:text-red-500"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      
      <div className="p-4">
        <div className="text-slate-500 text-xs mb-4">View workflow results</div>
        
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-700 mb-2">Output Preview</label>
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-sm text-slate-600 min-h-[60px] max-h-[180px] overflow-y-auto">
            {data.outputText ? (
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.outputText}</ReactMarkdown>
              </div>
            ) : (
              <span className="italic text-slate-500">Results will appear here after running the workflow</span>
            )}
          </div>
          
          {data.outputText && (
            <button
              onClick={data.onOpenChat}
              className="mt-3 w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-3 h-3" />
              See Output in Chat
            </button>
          )}
        </div>
      </div>

      <div className="px-4 py-2 border-t border-slate-100 flex justify-between text-xs text-slate-500 bg-slate-50 rounded-b-xl">
        <span className="text-amber-500">Input</span>
        <span className="text-emerald-500">Output</span>
      </div>
    </div>
  );
};
