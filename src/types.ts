export type ChatMode = 'general' | 'tutor' | 'coding' | 'career' | 'creative' | 'research';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: ChatMode;
  attachments?: FileAttachment[];
  isLoading?: boolean;
  isError?: boolean;
  liked?: boolean;
  disliked?: boolean;
  pinned?: boolean;
  sources?: SearchSource[];
  generatedImage?: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: string;
}

export interface SearchSource {
  title: string;
  url: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode: ChatMode;
  createdAt: number;
  updatedAt: number;
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  responseLength: 'concise' | 'balanced' | 'detailed';
}

export interface ModeInfo {
  id: ChatMode;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface ToolInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  placeholder: string;
}
