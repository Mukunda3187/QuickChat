import React, { useState, useRef, useEffect } from 'react';
import { SharedFile, AIAnalysis } from '../types';
import { CuteBotIcon } from './CuteBotIcon';
import {
  X,
  Send,
  FileText,
  ChevronDown,
  ChevronUp,
  FileCode,
  Image as ImageIcon,
  CheckSquare,
  Square,
  Lock,
  Trash2,
  Shield,
} from 'lucide-react';
interface AIInsightsPanelProps {
  files: SharedFile[];
  aiHistory: AIAnalysis[];
  privateAiHistory?: AIAnalysis[];
  isCreator?: boolean;
  allowStudentAi?: boolean;
  onTriggerAIAction: (
  action: 'query',
  files?: SharedFile[],
  customPrompt?: string
) => void;
  isThinking: boolean;
  onClose: () => void;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({
  files,
  aiHistory = [],
  privateAiHistory = [],
  isCreator = false,
  allowStudentAi = true,
  onTriggerAIAction,
  isThinking,
  onClose,
}) => {
  // Private system files uploaded solely for local AI chat
  const [privateFiles, setPrivateFiles] = useState<SharedFile[]>([]);
  const privateFileInputRef = useRef<HTMLInputElement>(null);

  const allAvailableFiles = [...files, ...privateFiles];

  // Multiselect file IDs state. Default to all files selected if available.
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>(allAvailableFiles.map((f) => f.id));
  const [promptInput, setPromptInput] = useState('');
  const [showDocDropdown, setShowDocDropdown] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync selected files when new files are uploaded
  useEffect(() => {
    if (selectedFileIds.length === 0 && allAvailableFiles.length > 0) {
      setSelectedFileIds(allAvailableFiles.map((f) => f.id));
    }
  }, [files, privateFiles]);

 const combinedHistory = [...(aiHistory || []), ...(privateAiHistory || [])].sort(
  (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [combinedHistory.length, isThinking]);

  const isAllSelected = allAvailableFiles.length > 0 && selectedFileIds.length === allAvailableFiles.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(allAvailableFiles.map((f) => f.id));
    }
  };

  const toggleSelectFile = (fileId: string) => {
    if (selectedFileIds.includes(fileId)) {
      setSelectedFileIds(selectedFileIds.filter((id) => id !== fileId));
    } else {
      setSelectedFileIds([...selectedFileIds, fileId]);
    }
  };

  const getSelectedFiles = (): SharedFile[] => {
    return allAvailableFiles.filter((f) => selectedFileIds.includes(f.id));
  };

  const handlePrivateFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadFiles = e.target.files;
    if (!uploadFiles || uploadFiles.length === 0) return;

    const newlyUploaded: SharedFile[] = [];
    for (let i = 0; i < uploadFiles.length; i++) {
      const f = uploadFiles[i];
      let textContent = '';
      if (
        f.type.includes('text') ||
        f.name.endsWith('.txt') ||
        f.name.endsWith('.json') ||
        f.name.endsWith('.js') ||
        f.name.endsWith('.ts') ||
        f.name.endsWith('.py') ||
        f.name.endsWith('.md') ||
        f.name.endsWith('.csv') ||
        f.name.endsWith('.html') ||
        f.name.endsWith('.css')
      ) {
        textContent = await f.text();
      } else {
        textContent = `[Private System File: ${f.name}, Size: ${(f.size / 1024).toFixed(1)} KB, Type: ${f.type || 'Document'}]`;
      }

      let fileKind = 'doc';
      if (f.name.endsWith('.pdf')) fileKind = 'pdf';
      else if (f.type.includes('image')) fileKind = 'image';
      else if (f.name.match(/\.(js|ts|py|cpp|java|html|css|json)$/)) fileKind = 'code';
      else if (f.name.endsWith('.txt')) fileKind = 'txt';

      const newFileObj: SharedFile = {
        id: 'pfile_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        name: f.name,
        size: f.size,
        type: fileKind,
        url: URL.createObjectURL(f),
        content: textContent,
        uploadedBy: 'You (Private)',
        uploadedAt: new Date().toISOString(),
        isPrivate: true,
      };
      newlyUploaded.push(newFileObj);
    }

    setPrivateFiles((prev) => [...prev, ...newlyUploaded]);
    setSelectedFileIds((prev) => [...prev, ...newlyUploaded.map((nf) => nf.id)]);
    if (e.target) e.target.value = '';
  };

  const handleRemovePrivateFile = (fileId: string) => {
    setPrivateFiles((prev) => prev.filter((f) => f.id !== fileId));
    setSelectedFileIds((prev) => prev.filter((id) => id !== fileId));
  };

const handleSendPrompt = (customPrompt?: string) => {
    const textToSubmit = customPrompt || promptInput;
    if (!textToSubmit.trim()) return;
    const targetFiles = getSelectedFiles();
    onTriggerAIAction('query', targetFiles, textToSubmit);
    setPromptInput('');
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <span className="text-rose-500 font-bold text-[10px]">PDF</span>;
    if (t.includes('code') || t.includes('js') || t.includes('ts')) return <FileCode className="w-3.5 h-3.5 text-emerald-500" />;
    if (t.includes('image')) return <ImageIcon className="w-3.5 h-3.5 text-purple-500" />;
    return <FileText className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <aside className="w-80 md:w-96 bg-emerald-50/40 dark:bg-zinc-950/95 border-l border-emerald-200/80 dark:border-zinc-800 flex flex-col shrink-0 h-full overflow-hidden transition-colors shadow-xl z-20">
      {/* Panel Header with Three-Dots Menu & Close Button */}
      <div className="p-3.5 px-4 border-b border-emerald-200/80 dark:border-zinc-800 flex items-center justify-between bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shrink-0 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 flex items-center justify-center text-white dark:text-black font-black shadow-xs">
            <CuteBotIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-black text-slate-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              AI Assistant
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
        
          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Close AI Assistant Tab"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Document Selector (Multi-select / All Options) */}
      <div className="p-3 bg-white/60 dark:bg-zinc-900/60 border-b border-emerald-200/80 dark:border-zinc-800 shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-1">
          <label className="text-[10px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
            <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Uploaded Documents
          </label>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => privateFileInputRef.current?.click()}
              className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-100/90 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 px-2 py-0.5 rounded-lg border border-purple-300 dark:border-purple-800 flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
              title="Import File"
            >
              Import File
            </button>
            <input
              type="file"
              ref={privateFileInputRef}
              onChange={handlePrivateFileUpload}
              multiple
              className="hidden"
            />
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-emerald-100/60 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-zinc-700">
              {selectedFileIds.length} / {allAvailableFiles.length}
            </span>
          </div>
        </div>
        )}

        {allAvailableFiles.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-zinc-500 italic p-1">No documents available.</p>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDocDropdown(!showDocDropdown)}
              className="w-full text-xs bg-white dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2 px-3 text-slate-900 dark:text-zinc-100 font-bold flex items-center justify-between hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all cursor-pointer shadow-2xs"
            >
              <span className="truncate">
                {isAllSelected
                  ? 'All Files'
                  : selectedFileIds.length === 0
                  ? '⚠️ Not selected'
                  : `📄 ${selectedFileIds.length} document(s) checked`}
              </span>
              {showDocDropdown ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Collapsible Document Selection Checklist */}
            {showDocDropdown && (
              <div className="mt-1.5 p-2 bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-zinc-800 rounded-2xl shadow-xl max-h-56 overflow-y-auto space-y-1.5 z-30 relative animate-in fade-in duration-150">
                {/* Select All Checkbox */}
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="w-full text-left p-2 rounded-xl flex items-center gap-2 hover:bg-emerald-50 dark:hover:bg-zinc-800 text-xs font-black text-emerald-950 dark:text-emerald-400 border-b border-emerald-100 dark:border-zinc-800 transition-colors"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>Select All Files</span>
                </button>

                {/* Individual File Checkboxes */}
                {allAvailableFiles.map((file) => {
                  const isChecked = selectedFileIds.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      className={`w-full p-2 rounded-xl flex items-center justify-between text-xs transition-colors ${
                        isChecked
                          ? file.isPrivate
                            ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-950 dark:text-purple-200 font-bold'
                            : 'bg-emerald-50/80 dark:bg-emerald-950/30 text-slate-900 dark:text-zinc-100 font-bold'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSelectFile(file.id)}
                        className="flex items-center gap-2 flex-1 text-left min-w-0 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className={`w-4 h-4 shrink-0 ${file.isPrivate ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-zinc-600 shrink-0" />
                        )}
                        <div className="shrink-0">{getFileIcon(file.type)}</div>
                        <span className="truncate">{file.name}</span>
                        {file.isPrivate && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-0.5 shrink-0">
                            <Lock className="w-2.5 h-2.5" /> Private
                          </span>
                        )}
                      </button>

                      {file.isPrivate && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemovePrivateFile(file.id);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors ml-1 cursor-pointer shrink-0"
                          title="Remove private file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Chat & Responses List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3.5 bg-emerald-50/20 dark:bg-zinc-950">
        {combinedHistory.length === 0 ? (
          <div className="text-center py-8 px-4 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CuteBotIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xs font-black text-slate-800 dark:text-zinc-200 uppercase tracking-wider">AI Assistant</h3>
          </div>
        ) : (
          combinedHistory.map((ai) => (
            <div
              key={ai.id}
              className={`p-3.5 bg-white dark:bg-zinc-900 rounded-2xl border shadow-xs space-y-2.5 ${
                ai.isPrivate
                  ? 'border-purple-300 dark:border-purple-900/80 ring-1 ring-purple-100 dark:ring-purple-950/50'
                  : 'border-emerald-200/80 dark:border-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between border-b border-emerald-100 dark:border-zinc-800 pb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-emerald-950 dark:text-emerald-400 flex items-center gap-1.5">
                    <CuteBotIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    {ai.title}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
                  {new Date(ai.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="text-xs text-slate-800 dark:text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap max-h-60 overflow-y-auto pr-1">
                {ai.content}
              </div>
            </div>
          ))
        )}

        {isThinking && (
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-emerald-300 dark:border-emerald-800 flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-300 font-bold shadow-xs">
            <CuteBotIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse shrink-0" />
            AI is reading document(s) & generating response...
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* AI Chat Input Bar & Quick Prompt Shortcuts */}
      <div className="p-3 bg-white/95 dark:bg-zinc-950 border-t border-emerald-200/80 dark:border-zinc-800 shrink-0 space-y-2 backdrop-blur-md">
        {!allowStudentAi ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-center gap-2 text-xs font-extrabold text-amber-800 dark:text-amber-300 text-center">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            AI Assistant is currently disabled.
          </div>
        ) : (
          <>

            {/* Prompt Input Bar */}
            <div className="flex items-center gap-2 bg-emerald-50/60 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2 px-3 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
                disabled={isThinking}
                placeholder={
                  selectedFileIds.length === 0
                    ? 'Ask AI anything...'
                    : `Ask AI about ${selectedFileIds.length} document(s)...`
                }
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-xs text-slate-900 dark:text-zinc-100 w-full placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />
              <button
                type="button"
                onClick={() => handleSendPrompt()}
                disabled={isThinking || !promptInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black disabled:opacity-40 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors cursor-pointer shadow-xs"
                title="Ask AI Assistant"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
