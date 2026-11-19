import React, { useEffect } from 'react';
import { useChatStore } from './store';
import { useTheme } from './hooks/useTheme';
import Sidebar from './components/Sidebar';
import Welcome from './components/Welcome';
import ChatArea from './components/ChatArea';
import Settings from './components/Settings';
import { Menu, Settings as SettingsIcon } from 'lucide-react';

export default function App() {
  useTheme();

  const activeId = useChatStore(s => s.activeId);
  const conversations = useChatStore(s => s.conversations);
  const sidebarOpen = useChatStore(s => s.sidebarOpen);
  const toggleSidebar = useChatStore(s => s.toggleSidebar);
  const toggleSettings = useChatStore(s => s.toggleSettings);
  const settingsOpen = useChatStore(s => s.settingsOpen);
  const createConversation = useChatStore(s => s.createConversation);
  const addMessage = useChatStore(s => s.addMessage);
  const mode = useChatStore(s => s.mode);

  const activeConv = conversations.find(c => c.id === activeId);
  const hasMessages = activeConv && activeConv.messages.length > 0;

  // Ctrl+B to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  const handleSuggestion = (text: string) => {
    const id = createConversation(text.length > 36 ? text.slice(0, 36) + '…' : text);
    setTimeout(() => {
      addMessage(id, {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2),
        role: 'user',
        content: text,
        timestamp: Date.now(),
        mode,
      });
    }, 30);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 dark:bg-zinc-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main */}
      <main className="flex flex-1 flex-col min-w-0 h-full relative">
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 h-14 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm flex-shrink-0 z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-medium text-zinc-300 truncate max-w-[200px]">
              {activeConv ? activeConv.title : 'NOVA AI'}
            </span>
          </div>
          <button
            onClick={toggleSettings}
            className="p-2 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <SettingsIcon size={18} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeId && hasMessages ? (
            <ChatArea />
          ) : (
            <Welcome onSuggestionClick={handleSuggestion} />
          )}
        </div>
      </main>

      {/* Settings modal */}
      {settingsOpen && <Settings />}
    </div>
  );
}
