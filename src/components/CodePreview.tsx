// src/components/CodePreview.tsx
'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodePreviewProps {
  filename: string;
  content: string;
}

export function CodePreview({ filename, content }: CodePreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLanguage = () => {
    if (filename.endsWith('.ts') || filename.endsWith('.tsx')) return 'typescript';
    if (filename.endsWith('.rs')) return 'rust';
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.toml')) return 'toml';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  const lineCount = content.split('\n').length;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 border-b border-gray-300 px-4 py-3 flex justify-between items-center">
        <div>
          <p className="font-mono text-sm font-medium text-gray-900">{filename}</p>
          <p className="text-xs text-gray-600 mt-1">{lineCount} lines • {getLanguage()}</p>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-50 transition"
        >
          {copied ? (
            <>
              <Check size={16} className="text-green-600" />
              <span className="text-sm text-green-600">Copied</span>
            </>
          ) : (
            <>
              <Copy size={16} className="text-gray-600" />
              <span className="text-sm text-gray-600">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Display */}
      <div className="flex-1 overflow-auto bg-gray-950">
        <pre className="p-4 text-sm text-gray-100 font-mono leading-relaxed whitespace-pre-wrap break-words">
          <code>{content}</code>
        </pre>
      </div>
    </div>
  );
}
