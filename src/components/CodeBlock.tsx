import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface Props {
  language: string;
  code: string;
}

export default function CodeBlock({ language, code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-800/60 my-3 bg-[#1a1b26]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/40 border-b border-zinc-700/40">
        <span className="text-xs text-zinc-400 font-mono">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition"
        >
          {copied ? (
            <><Check size={12} className="text-green-400" /> Copied</>
          ) : (
            <><Copy size={12} /> Copy</>
          )}
        </button>
      </div>
      {/* Code */}
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '16px',
          background: 'transparent',
          fontSize: '13px',
          lineHeight: '1.6',
        }}
        showLineNumbers={code.split('\n').length > 5}
        lineNumberStyle={{ color: '#3f3f46', marginRight: '12px' }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
