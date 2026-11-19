import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from '../store';
import { sendChatMessage, searchChat } from '../api';
import { useVoice } from '../hooks/useVoice';
import { Send, Paperclip, Mic, MicOff, Globe, X, Loader2 } from 'lucide-react';
import type { FileAttachment, ChatMessage } from '../types';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export default function ChatInput() {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeId = useChatStore(s => s.activeId);
  const mode = useChatStore(s => s.mode);
  const conversations = useChatStore(s => s.conversations);
  const createConversation = useChatStore(s => s.createConversation);
  const addMessage = useChatStore(s => s.addMessage);
  const updateMessage = useChatStore(s => s.updateMessage);

  const voice = useVoice();

  // Apply voice transcript
  useEffect(() => {
    if (voice.transcript) {
      setText(prev => prev + voice.transcript);
      voice.setTranscript('');
    }
  }, [voice.transcript]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 180) + 'px';
    }
  }, [text]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    for (const file of selected) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 20MB limit.`);
        continue;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        setFiles(prev => [...prev, {
          id: uid(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
        }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removeFile = (id: string) => setFiles(prev => prev.filter(f => f.id !== id));

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content && files.length === 0) return;
    if (isLoading) return;

    // Determine conversation
    let convId = activeId;
    if (!convId) {
      const title = content.length > 36 ? content.slice(0, 36) + '…' : content || 'New Chat';
      convId = createConversation(title);
    }

    // Auto-title if first message
    const conv = useChatStore.getState().conversations.find(c => c.id === convId);
    if (conv && conv.messages.length === 0 && conv.title === 'New Chat' && content) {
      useChatStore.getState().renameConversation(convId, content.length > 36 ? content.slice(0, 36) + '…' : content);
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: uid(), role: 'user', content, timestamp: Date.now(), mode, attachments: files,
    };
    addMessage(convId, userMsg);

    // Add loading placeholder
    const assistantId = uid();
    addMessage(convId, {
      id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), isLoading: true,
    });

    setText('');
    setFiles([]);
    setIsLoading(true);

    try {
      if (webSearch) {
        // Search grounded chat
        const result = await searchChat(content);
        updateMessage(convId, assistantId, {
          content: result.text,
          sources: result.sources,
          isLoading: false,
        });
      } else {
        // Streaming chat
        const history = (useChatStore.getState().conversations.find(c => c.id === convId)?.messages || [])
          .filter(m => m.id !== assistantId && !m.isLoading);

        const controller = new AbortController();
        abortRef.current = controller;

        const stream = await sendChatMessage(content, history, mode, userMsg.attachments || [], controller.signal);
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = line.slice(6);
            if (payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.error) {
                updateMessage(convId!, assistantId, { content: `Error: ${parsed.error}`, isLoading: false, isError: true });
                setIsLoading(false);
                return;
              }
              if (parsed.text) {
                fullText += parsed.text;
                updateMessage(convId!, assistantId, { content: fullText, isLoading: false });
              }
            } catch {}
          }
        }
        if (!fullText) {
          updateMessage(convId!, assistantId, { content: 'No response received.', isLoading: false });
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        updateMessage(convId!, assistantId, {
          content: `Error: ${err.message || 'Failed to get response'}`,
          isLoading: false,
          isError: true,
        });
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [text, files, activeId, mode, webSearch, isLoading, createConversation, addMessage, updateMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full">
      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 mb-2 flex-wrap">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-2 bg-zinc-800/60 rounded-lg px-3 py-1.5 text-xs text-zinc-300">
              <span className="truncate max-w-[120px]">{f.name}</span>
              <button onClick={() => removeFile(f.id)} className="text-zinc-500 hover:text-zinc-300">
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input container */}
      <div className={`flex flex-col bg-zinc-900 border rounded-2xl transition-all
        ${isLoading ? 'border-purple-500/30' : 'border-zinc-700/50 focus-within:border-purple-500/40'}
        shadow-lg shadow-black/20`}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message NOVA…"
          disabled={isLoading}
          rows={1}
          className="w-full resize-none bg-transparent px-4 pt-3.5 pb-1 text-sm text-zinc-100
                     placeholder-zinc-500 outline-none disabled:opacity-50"
        />

        {/* Actions bar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          <div className="flex items-center gap-1">
            {/* Upload */}
            <input ref={fileInputRef} type="file" multiple accept="image/*,.pdf,.txt,.md,.csv,.json" onChange={handleFileSelect} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition disabled:opacity-40"
              title="Attach file"
            >
              <Paperclip size={16} />
            </button>

            {/* Voice */}
            {voice.isSupported && (
              <button
                onClick={voice.isListening ? voice.stopListening : voice.startListening}
                disabled={isLoading}
                className={`p-2 rounded-lg transition disabled:opacity-40 ${
                  voice.isListening
                    ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
                title={voice.isListening ? 'Stop listening' : 'Voice input'}
              >
                {voice.isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}

            {/* Web search toggle */}
            <button
              onClick={() => setWebSearch(!webSearch)}
              disabled={isLoading}
              className={`p-2 rounded-lg transition disabled:opacity-40 ${
                webSearch
                  ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }`}
              title={webSearch ? 'Web search ON' : 'Enable web search'}
            >
              <Globe size={16} />
            </button>
          </div>

          {/* Send */}
          <button
            onClick={handleSend}
            disabled={isLoading && !abortRef.current}
            className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600
                       text-white transition-all hover:from-purple-500 hover:to-blue-500
                       shadow-lg shadow-purple-600/20 disabled:opacity-40 disabled:shadow-none
                       active:scale-95"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
