import React from 'react';
import { Code, BookOpen, FileText, Globe, Lightbulb, Briefcase, Sparkles } from 'lucide-react';
import ChatInput from './ChatInput';

const suggestions = [
  { icon: <Code size={20} />,       text: 'Write code for me',           color: 'from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 border-green-500/20' },
  { icon: <BookOpen size={20} />,    text: 'Learn something new',         color: 'from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 border-blue-500/20' },
  { icon: <FileText size={20} />,    text: 'Analyze a document',          color: 'from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-500/20' },
  { icon: <Globe size={20} />,       text: 'Research a topic',            color: 'from-cyan-500/10 to-teal-500/10 hover:from-cyan-500/20 hover:to-teal-500/20 border-cyan-500/20' },
  { icon: <Lightbulb size={20} />,   text: 'Generate creative ideas',     color: 'from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20 border-pink-500/20' },
  { icon: <Briefcase size={20} />,   text: 'Prepare for interviews',      color: 'from-purple-500/10 to-violet-500/10 hover:from-purple-500/20 hover:to-violet-500/20 border-purple-500/20' },
];

interface WelcomeProps {
  onSuggestionClick: (text: string) => void;
}

export default function Welcome({ onSuggestionClick }: WelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 pb-6 overflow-y-auto">
      <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
        {/* Animated Orb */}
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-400 animate-glow-pulse shadow-2xl shadow-purple-500/30" />
          <div className="absolute inset-[6px] rounded-full bg-zinc-950 flex items-center justify-center">
            <Sparkles className="text-purple-400" size={22} />
          </div>
          {/* Orbital ring */}
          <div className="absolute -inset-3 rounded-full border border-purple-500/20 animate-spin-slow" />
          <div className="absolute -inset-5 rounded-full border border-blue-500/10 animate-spin-reverse" />
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">
          Hello, I'm{' '}
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            NOVA
          </span>
        </h1>
        <p className="text-zinc-400 text-base mb-10">
          What would you like to explore today?
        </p>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full mb-10">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestionClick(s.text)}
              className={`flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-br
                         text-left transition-all duration-200 group active:scale-[0.98] ${s.color}`}
            >
              <span className="text-zinc-300 group-hover:text-zinc-100 transition-colors">
                {s.icon}
              </span>
              <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                {s.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input at bottom */}
      <div className="w-full max-w-2xl mt-auto">
        <ChatInput />
      </div>
    </div>
  );
}
