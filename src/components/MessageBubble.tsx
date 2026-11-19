import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useChatStore } from '../store';
import { useVoice } from '../hooks/useVoice';
import { sendChatMessage } from '../api';
import CodeBlock from './CodeBlock';
import {
  Copy, Check, RefreshCw, ThumbsUp, ThumbsDown,
  Volume2, VolumeX, Pin, ExternalLink, Sparkles, User,
} from 'lucide-react';
import type { ChatMessage } from '../types';

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }

interface Props {
  message: ChatMessage;
  conversationId: string;
}

export default function MessageBubble({ message, conversationId }: Props) {
  const [copied, setCopied] = useState(false);
  const updateMessage = useChatStore(s => s.updateMessage);
  const addMessage = useChatStore(s => s.addMessage);
  const conversations = useChatStore(s => s.conversations);
  const mode = useChatStore(s => s.mode);
  const voice = useVoice();

  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    const conv = conversations.find(c => c.id === conversationId);
    if (!conv) return;

    // Find the user message before this one
    const idx = conv.messages.findIndex(m => m.id === message.id);
    const prevUserMsg = conv.messages.slice(0, idx).reverse().find(m => m.role === 'user');
    if (!prevUserMsg) return;

    const history = conv.messages.slice(0, idx - 1);

    updateMessage(conversationId, message.id, { isLoading: true, content: '', isError: false });

    try {
      const stream = await sendChatMessage(prevUserMsg.content, history, mode, prevUserMsg.attachments || []);
      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              fullText += parsed.text;
              updateMessage(conversationId, message.id, { content: fullText, isLoading: false });
            }
            if (parsed.error) {
              updateMessage(conversationId, message.id, { content: `Error: ${parsed.error}`, isLoading: false, isError: true });
              return;
            }
          } catch {}
        }
      }
    } catch (err: any) {
      updateMessage(conversationId, message.id, { content: `Error: ${err.message}`, isLoading: false, isError: true });
    }
  };

  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20 mt-0.5">
          <Sparkles size={14} className="text-white" />
        </div>
      )}

      <div className={`max-w-[80%] min-w-0 ${isUser ? 'order-first' : ''}`}>
        {/* Bubble */}
        <div className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-purple-600/90 to-blue-600/90 text-white rounded-br-md'
            : 'bg-zinc-900 border border-zinc-800/60 text-zinc-200 rounded-bl-md'
        }`}>
          {/* File badges */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {message.attachments.map(f => (
                <span key={f.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/10 text-[11px]">
                  📎 {f.name}
                </span>
              ))}
            </div>
          )}

          {/* Loading */}
          {message.isLoading ? (
            <div className="flex gap-1.5 py-1">
              <span className="typing-dot w-2 h-2 rounded-full bg-purple-400" />
              <span className="typing-dot w-2 h-2 rounded-full bg-purple-400" />
              <span className="typing-dot w-2 h-2 rounded-full bg-purple-400" />
            </div>
          ) : (
            /* Content */
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const inline = !match && !className;
                    if (inline) {
                      return (
                        <code className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-purple-300 text-[13px]" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return <CodeBlock language={match?.[1] || ''} code={String(children).replace(/\n$/, '')} />;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Generated image */}
          {message.generatedImage && (
            <img src={`data:image/png;base64,${message.generatedImage}`} alt="Generated" className="mt-3 rounded-xl max-w-full" />
          )}
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 bg-cyan-500/5 rounded-md px-2 py-1 transition"
              >
                <ExternalLink size={10} /> {s.title}
              </a>
            ))}
          </div>
        )}

        {/* Actions (assistant only) */}
        {!isUser && !message.isLoading && message.content && (
          <div className="flex items-center gap-1 mt-2">
            <button onClick={handleCopy} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition" title="Copy">
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
            <button onClick={handleRegenerate} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition" title="Regenerate">
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => updateMessage(conversationId, message.id, { liked: !message.liked, disliked: false })}
              className={`p-1.5 rounded-md transition ${message.liked ? 'text-green-400 bg-green-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
              title="Like"
            >
              <ThumbsUp size={14} />
            </button>
            <button
              onClick={() => updateMessage(conversationId, message.id, { disliked: !message.disliked, liked: false })}
              className={`p-1.5 rounded-md transition ${message.disliked ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
              title="Dislike"
            >
              <ThumbsDown size={14} />
            </button>
            <button
              onClick={() => voice.isSpeaking ? voice.stopSpeaking() : voice.speak(message.content)}
              className={`p-1.5 rounded-md transition ${voice.isSpeaking ? 'text-purple-400 bg-purple-500/10' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
              title={voice.isSpeaking ? 'Stop' : 'Read aloud'}
            >
              {voice.isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        )}

        {/* Error retry */}
        {message.isError && (
          <button
            onClick={handleRegenerate}
            className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
          >
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <User size={14} className="text-zinc-300" />
        </div>
      )}
    </div>
  );
}
