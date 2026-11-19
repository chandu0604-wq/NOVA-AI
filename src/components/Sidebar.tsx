import React, { useState } from 'react';
import { useChatStore } from '../store';
import {
  MessageSquarePlus, Search, Trash2, Pencil, X, Check,
  Sparkles, BookOpen, Code, Briefcase, Palette, Globe,
} from 'lucide-react';
import type { ChatMode, ModeInfo } from '../types';

const MODES: ModeInfo[] = [
  { id: 'general',  name: 'General',   icon: '✦', description: 'Everyday assistant',    color: 'from-purple-500 to-blue-500' },
  { id: 'tutor',    name: 'Tutor',     icon: '📚', description: 'Study & learn',          color: 'from-blue-500 to-cyan-500' },
  { id: 'coding',   name: 'Code',      icon: '💻', description: 'Write & debug code',     color: 'from-green-500 to-emerald-500' },
  { id: 'career',   name: 'Career',    icon: '🎯', description: 'Career coaching',        color: 'from-orange-500 to-amber-500' },
  { id: 'creative', name: 'Creative',  icon: '🎨', description: 'Ideas & stories',        color: 'from-pink-500 to-rose-500' },
  { id: 'research', name: 'Research',  icon: '🔬', description: 'Deep analysis',          color: 'from-cyan-500 to-teal-500' },
];

export default function Sidebar() {
  const conversations = useChatStore(s => s.conversations);
  const activeId = useChatStore(s => s.activeId);
  const mode = useChatStore(s => s.mode);
  const sidebarOpen = useChatStore(s => s.sidebarOpen);
  const toggleSidebar = useChatStore(s => s.toggleSidebar);
  const setActive = useChatStore(s => s.setActive);
  const createConversation = useChatStore(s => s.createConversation);
  const deleteConversation = useChatStore(s => s.deleteConversation);
  const renameConversation = useChatStore(s => s.renameConversation);
  const setMode = useChatStore(s => s.setMode);

  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    createConversation();
  };

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };

  const confirmRename = () => {
    if (editingId && editTitle.trim()) {
      renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <aside
      className={`
        fixed md:relative z-40 h-full flex flex-col
        w-72 bg-zinc-900 border-r border-zinc-800/60
        transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-zinc-800/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles size={14} className="text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-zinc-100">NOVA AI</span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-zinc-800/60 text-zinc-500 hover:text-zinc-300 transition md:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* New Chat */}
      <div className="px-4 pt-4 pb-2 flex-shrink-0">
        <button
          onClick={handleNew}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                     bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500
                     text-white text-sm font-semibold transition-all shadow-lg shadow-purple-600/20
                     hover:shadow-purple-500/30 active:scale-[0.98]"
        >
          <MessageSquarePlus size={16} />
          New Chat
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search chats…"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50
                       text-sm text-zinc-300 placeholder-zinc-500 outline-none
                       focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition"
          />
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        {filtered.length === 0 && (
          <p className="text-xs text-zinc-500 text-center py-8">No conversations yet</p>
        )}
        {filtered.map(c => (
          <div
            key={c.id}
            className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
              ${c.id === activeId
                ? 'bg-zinc-800/80 text-zinc-100'
                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
              }`}
            onClick={() => setActive(c.id)}
          >
            {editingId === c.id ? (
              <div className="flex items-center gap-1 flex-1 min-w-0">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && confirmRename()}
                  className="flex-1 bg-zinc-700/50 px-2 py-0.5 rounded text-sm outline-none text-zinc-200"
                  onClick={e => e.stopPropagation()}
                />
                <button onClick={(e) => { e.stopPropagation(); confirmRename(); }} className="p-1 text-green-400 hover:text-green-300">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm truncate flex-1">{c.title}</span>
                <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); startRename(c.id, c.title); }}
                    className="p-1 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-zinc-300"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); deleteConversation(c.id); }}
                    className="p-1 rounded hover:bg-zinc-700/60 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Mode selector */}
      <div className="px-3 pb-4 pt-2 border-t border-zinc-800/60 flex-shrink-0">
        <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider px-2 pb-2">Mode</p>
        <div className="grid grid-cols-3 gap-1.5">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[11px] font-medium transition-all
                ${mode === m.id
                  ? 'bg-zinc-800 text-zinc-100 ring-1 ring-purple-500/40'
                  : 'text-zinc-500 hover:bg-zinc-800/40 hover:text-zinc-300'
                }`}
            >
              <span className="text-base">{m.icon}</span>
              <span>{m.name}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
