import React from 'react';
import { useChatStore } from '../store';
import { X, Moon, Sun, Trash2, Download } from 'lucide-react';

export default function Settings() {
  const toggleSettings = useChatStore(s => s.toggleSettings);
  const preferences = useChatStore(s => s.preferences);
  const updatePreferences = useChatStore(s => s.updatePreferences);
  const conversations = useChatStore(s => s.conversations);
  const clearAll = useChatStore(s => s.clearAll);

  const handleExport = () => {
    const data = JSON.stringify(conversations, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nova-ai-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Delete all conversations and data? This cannot be undone.')) {
      clearAll();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in" onClick={toggleSettings}>
      <div className="bg-zinc-900 border border-zinc-800/60 rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button onClick={toggleSettings} className="p-1.5 rounded-lg hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 transition">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Theme */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-3 block">Theme</label>
            <div className="flex gap-3">
              <button
                onClick={() => updatePreferences({ theme: 'dark' })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${preferences.theme === 'dark'
                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                    : 'border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                  }`}
              >
                <Moon size={16} /> Dark
              </button>
              <button
                onClick={() => updatePreferences({ theme: 'light' })}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
                  ${preferences.theme === 'light'
                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                    : 'border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                  }`}
              >
                <Sun size={16} /> Light
              </button>
            </div>
          </div>

          {/* Response length */}
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-3 block">Response Length</label>
            <div className="flex gap-2">
              {(['concise', 'balanced', 'detailed'] as const).map(opt => (
                <button
                  key={opt}
                  onClick={() => updatePreferences({ responseLength: opt })}
                  className={`flex-1 py-2 rounded-xl border text-sm font-medium capitalize transition-all
                    ${preferences.responseLength === opt
                      ? 'border-purple-500/50 bg-purple-500/10 text-purple-300'
                      : 'border-zinc-700/50 text-zinc-400 hover:border-zinc-600'
                    }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-zinc-800/60" />

          {/* Data */}
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-700/50 text-sm text-zinc-300 hover:bg-zinc-800/40 hover:border-zinc-600 transition"
            >
              <Download size={16} /> Export Conversations
            </button>
            <button
              onClick={handleClear}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-900/50 text-sm text-red-400 hover:bg-red-500/10 transition"
            >
              <Trash2 size={16} /> Clear All Data
            </button>
          </div>

          {/* Privacy note */}
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            All conversations are stored locally on your device. No data is sent to external servers beyond the Gemini API.
          </p>
        </div>
      </div>
    </div>
  );
}
