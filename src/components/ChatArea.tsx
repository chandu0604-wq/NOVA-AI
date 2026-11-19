import React, { useRef, useEffect } from 'react';
import { useChatStore } from '../store';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

export default function ChatArea() {
  const activeId = useChatStore(s => s.activeId);
  const conversations = useChatStore(s => s.conversations);
  const conv = conversations.find(c => c.id === activeId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages]);

  if (!conv) return null;

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {conv.messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} conversationId={conv.id} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 pb-4 px-4">
        <div className="max-w-3xl mx-auto">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}
