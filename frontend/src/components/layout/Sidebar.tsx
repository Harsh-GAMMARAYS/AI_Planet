import React from 'react';
import { MessageCircle } from 'lucide-react';

interface Component {
  id: string;
  name: string;
  icon: React.ReactElement;
}

interface SidebarProps {
  components: Component[];
  onComponentSelect: (componentId: string) => void;
  onChatOpen: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  components, 
  onComponentSelect, 
  onChatOpen 
}) => {
  return (
    <aside className="w-72 bg-white border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <button 
          className="w-full bg-emerald-500 text-white border-none px-4 py-3 rounded-lg font-medium cursor-pointer transition-all duration-200 hover:bg-emerald-600 flex items-center gap-2 justify-center"
          onClick={onChatOpen}
        >
          <MessageCircle className="w-4 h-4" />
          Chat With AI
        </button>
      </div>
      
      <div className="p-4 flex-1">
        <h3 className="mb-4 text-slate-800 text-base font-semibold">Components</h3>
        <div className="flex flex-col gap-2">
          {components.map((comp) => (
            <div 
              key={comp.id}
              className="px-3 py-3 bg-white border border-slate-200 rounded-md cursor-grab transition-all duration-200 flex items-center gap-3 hover:border-emerald-500 hover:shadow-sm hover:shadow-emerald-100 active:cursor-grabbing group"
              onClick={() => onComponentSelect(comp.id)}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', comp.id);
                event.dataTransfer.effectAllowed = 'move';
              }}
              title={`Drag ${comp.name} to canvas`}
            >
              <div className="flex-shrink-0 text-slate-400 group-hover:text-slate-600 transition-colors duration-200">
                {comp.icon}
              </div>
              <span className="flex-1 text-slate-700 font-medium">{comp.name}</span>
              <span className="text-slate-400 cursor-grab opacity-60 group-hover:opacity-100 transition-opacity duration-200">⋮⋮</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
