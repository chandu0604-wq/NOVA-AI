import { create } from 'zustand';
import type { Conversation, ChatMessage, ChatMode, UserPreferences } from './types';

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

interface ChatState {
  conversations: Conversation[];
  activeId: string | null;
  mode: ChatMode;
  preferences: UserPreferences;
  sidebarOpen: boolean;
  settingsOpen: boolean;

  // Actions
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  setActive: (id: string | null) => void;
  addMessage: (convId: string, msg: ChatMessage) => void;
  updateMessage: (convId: string, msgId: string, patch: Partial<ChatMessage>) => void;
  setMode: (m: ChatMode) => void;
  toggleSidebar: () => void;
  toggleSettings: () => void;
  updatePreferences: (p: Partial<UserPreferences>) => void;
  clearAll: () => void;
  getActiveConversation: () => Conversation | undefined;
}

const STORAGE_KEY = 'nova-ai-v2';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(state: Partial<ChatState>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      conversations: state.conversations,
      preferences: state.preferences,
      mode: state.mode,
    }));
  } catch {}
}

const persisted = loadState();

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: persisted?.conversations || [],
  activeId: null,
  mode: persisted?.mode || 'general',
  preferences: persisted?.preferences || { theme: 'dark', responseLength: 'balanced' },
  sidebarOpen: true,
  settingsOpen: false,

  createConversation: (title?: string) => {
    const id = uid();
    const conv: Conversation = {
      id,
      title: title || 'New Chat',
      messages: [],
      mode: get().mode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set(s => {
      const next = { conversations: [conv, ...s.conversations], activeId: id };
      saveState({ ...s, ...next });
      return next;
    });
    return id;
  },

  deleteConversation: (id) => {
    set(s => {
      const conversations = s.conversations.filter(c => c.id !== id);
      const activeId = s.activeId === id ? null : s.activeId;
      const next = { conversations, activeId };
      saveState({ ...s, ...next });
      return next;
    });
  },

  renameConversation: (id, title) => {
    set(s => {
      const conversations = s.conversations.map(c => c.id === id ? { ...c, title } : c);
      saveState({ ...s, conversations });
      return { conversations };
    });
  },

  setActive: (id) => set({ activeId: id }),

  addMessage: (convId, msg) => {
    set(s => {
      const conversations = s.conversations.map(c => {
        if (c.id !== convId) return c;
        return { ...c, messages: [...c.messages, msg], updatedAt: Date.now() };
      });
      saveState({ ...s, conversations });
      return { conversations };
    });
  },

  updateMessage: (convId, msgId, patch) => {
    set(s => {
      const conversations = s.conversations.map(c => {
        if (c.id !== convId) return c;
        return {
          ...c,
          messages: c.messages.map(m => m.id === msgId ? { ...m, ...patch } : m),
          updatedAt: Date.now(),
        };
      });
      saveState({ ...s, conversations });
      return { conversations };
    });
  },

  setMode: (m) => {
    set(s => {
      saveState({ ...s, mode: m });
      return { mode: m };
    });
  },

  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  toggleSettings: () => set(s => ({ settingsOpen: !s.settingsOpen })),

  updatePreferences: (p) => {
    set(s => {
      const preferences = { ...s.preferences, ...p };
      saveState({ ...s, preferences });
      return { preferences };
    });
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ conversations: [], activeId: null });
  },

  getActiveConversation: () => {
    const s = get();
    return s.conversations.find(c => c.id === s.activeId);
  },
}));
