import type { ChatMessage, ChatMode, FileAttachment } from './types';

const API = '/api';

export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  mode: ChatMode,
  attachments: FileAttachment[] = [],
  signal?: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${API}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      history: history.map(m => ({ role: m.role, content: m.content })),
      mode,
      attachments: attachments.map(a => ({ name: a.name, type: a.type, data: a.data })),
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Server error ${res.status}`);
  if (!res.body) throw new Error('No response body');
  return res.body;
}

export async function searchChat(message: string): Promise<{ text: string; sources: { title: string; url: string }[] }> {
  const res = await fetch(`${API}/chat/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error(`Search error ${res.status}`);
  return res.json();
}

export async function generateImage(prompt: string): Promise<{ image?: string; mimeType?: string; error?: string }> {
  const res = await fetch(`${API}/image/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Image generation error ${res.status}`);
  }
  return res.json();
}

export async function runTool(toolId: string, input: string): Promise<{ text: string }> {
  const res = await fetch(`${API}/tools`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toolId, input }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Tool error ${res.status}`);
  }
  return res.json();
}
