import React from 'react';
import { Save, User, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  onSave: (workflowData?: { nodes: any[]; edges: any[] }) => void;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSave, onBack }) => {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            ai
          </div>
          <span className="text-xl font-semibold text-slate-800">GenAI Stack</span>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSave()}
          className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save
        </button>
        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
};
