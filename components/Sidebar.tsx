
import React from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Plus, Trash2, Database, LayoutGrid } from 'lucide-react';

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession
}) => {
  return (
    <div className="flex flex-col w-[280px] bg-[#0c0c0e] border-r border-white/5 h-full overflow-hidden transition-all duration-300">
      <div className="p-5">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl border border-white/10 transition-all duration-300 group shadow-sm active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <Plus size={18} className="text-cyan-400" />
            <span className="font-semibold text-sm">New Session</span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-white/40">
            ⌘N
          </kbd>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
        <div className="px-3 mb-3 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
          Active Queries
        </div>
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${
              activeSessionId === session.id
                ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'
            }`}
            onClick={() => onSelectSession(session.id)}
          >
            <MessageSquare size={16} className={activeSessionId === session.id ? 'text-cyan-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
            <span className="truncate text-sm font-medium pr-6">{session.title}</span>
            
            <div className="absolute right-2 flex items-center gap-1">
               <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteSession(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {activeSessionId === session.id && (
              <div className="absolute left-0 w-1 h-4 bg-cyan-500 rounded-full" />
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-sm">VA</span>
              </div>
              <div className="flex flex-col">
                <p className="text-sm font-bold text-zinc-200 leading-none">Veera AI</p>
                <p className="text-[10px] text-zinc-500 mt-1.5 font-medium uppercase tracking-tighter">Next-Gen Cloud</p>
              </div>
            </div>
            <Database size={16} className="text-zinc-500 group-hover:text-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
