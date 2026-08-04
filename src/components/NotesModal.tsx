import React, { useState } from 'react';
import { BookOpen, Copy, Check, Download, X } from 'lucide-react';

interface NotesModalProps {
  title: string;
  content: string;
  onClose: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ title, content, onClose }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_Notes.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-2xl w-full border border-emerald-200/80 dark:border-zinc-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-emerald-200/80 dark:border-zinc-800 flex items-center justify-between bg-emerald-100/50 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-black font-black shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-zinc-100">{title}</h2>
              <p className="text-xs text-emerald-800 dark:text-emerald-400 font-bold">AI Formatted Study & Workspace Notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-emerald-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto font-sans text-xs md:text-sm text-slate-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap bg-emerald-50/20 dark:bg-zinc-900/60 flex-1">
          {content}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-zinc-400 font-medium">Notes downloaded will remain on your local device only.</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3.5 py-2 text-xs font-bold text-slate-800 dark:text-zinc-200 bg-emerald-100/60 dark:bg-zinc-800 hover:bg-emerald-200/80 dark:hover:bg-zinc-700 border border-emerald-200 dark:border-zinc-700 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy Notes'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-bold text-white dark:text-black bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs dark:shadow-[0_0_12px_rgba(16,185,129,0.3)]"
            >
              <Download className="w-3.5 h-3.5" />
              Download .TXT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
