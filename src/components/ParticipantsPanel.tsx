import React, { useRef, useState } from 'react';
import { Participant } from '../types';

interface ParticipantsPanelProps {
  participants: Participant[];
  currentUserId: string;
  isCreator: boolean;
  isCoHost?: boolean;
  allowStudentAi?: boolean;
  files: SharedFile[];
  onUploadFile: (file: File) => void;
  onAskAIAboutFile: (file: SharedFile) => void;
  onToggleCoHost?: (targetId: string, isCoHost: boolean) => void;
  onKickParticipant?: (targetId: string) => void;
  onClose?: () => void;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  currentUserId,
  isCreator,
  isCoHost,
  allowStudentAi = true,
  files,
  onUploadFile,
  onAskAIAboutFile,
  onToggleCoHost,
  onKickParticipant,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const canManage = isCreator || isCoHost;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('pdf')) return <span className="text-rose-500 font-bold text-xs">PDF</span>;
    if (t.includes('doc')) return <span className="text-blue-500 font-bold text-xs">DOC</span>;
    if (t.includes('code') || t.includes('js') || t.includes('ts') || t.includes('py') || t.includes('html') || t.includes('json'))
      return <FileCode className="w-4 h-4 text-emerald-600" />;
    if (t.includes('image') || t.includes('png') || t.includes('jpg'))
      return <ImageIcon className="w-4 h-4 text-purple-600" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <aside className="w-64 md:w-72 bg-emerald-50/40 dark:bg-zinc-950/90 border-r border-emerald-200/80 dark:border-zinc-800 flex flex-col shrink-0 h-full overflow-hidden transition-colors">
      {/* Participants Section */}
      <div className="p-4 border-b border-emerald-200/80 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Participants ({participants.length})
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-ping" title="Session Active" />
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-emerald-200/60 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400 cursor-pointer transition-colors"
                title="Close Participants Tab"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          {participants.map((p) => {
            const isMe = p.id === currentUserId;
            const initials = p.name ? p.name.substring(0, 2).toUpperCase() : 'U';
            const showManagement = canManage && !isMe && !p.isCreator;

            return (
              <div
                key={p.id}
                className="relative flex items-center justify-between group p-1.5 rounded-xl hover:bg-emerald-100/40 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 overflow-hidden pr-1">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-7 h-7 rounded-full object-cover shrink-0 border border-emerald-300 dark:border-zinc-700 shadow-2xs"
                    />
                  ) : p.avatarColor ? (
                    <div
                      style={{ backgroundColor: p.avatarColor }}
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/30 shadow-2xs"
                    >
                      {initials}
                    </div>
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                        p.isCreator
                          ? 'bg-amber-500 text-black border-amber-400 shadow-xs'
                          : p.isCoHost
                          ? 'bg-purple-600 text-white border-purple-400'
                          : 'bg-emerald-100 dark:bg-zinc-800 border-emerald-200 dark:border-zinc-700 text-emerald-900 dark:text-zinc-200'
                      }`}
                    >
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                      {p.name} {isMe && <span className="text-emerald-700 dark:text-emerald-400 font-bold">(You)</span>}
                    </span>
                    <div className="flex items-center gap-1">
                      {p.isCreator && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-400 px-1 rounded border border-amber-300 dark:border-amber-800">
                          Host
                        </span>
                      )}
                      {p.isCoHost && !p.isCreator && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 px-1 rounded border border-purple-300 dark:border-purple-800">
                          Co-Host
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Management Options for Host / Co-Host */}
                {showManagement && (
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === p.id ? null : p.id);
                      }}
                      className={`p-1 rounded-lg hover:bg-emerald-200/60 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 cursor-pointer transition-opacity ${
                        activeMenuId === p.id ? 'opacity-100 bg-emerald-200/60 dark:bg-zinc-700' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      title="Participant Options"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuId === p.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setActiveMenuId(null)}
                        />
                        <div className="absolute right-0 top-7 z-50 w-44 bg-white dark:bg-zinc-900 rounded-xl shadow-xl border border-emerald-200 dark:border-zinc-800 p-1 space-y-1 animate-in fade-in duration-100">
                          {onToggleCoHost && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleCoHost(p.id, !p.isCoHost);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-slate-700 dark:text-zinc-200 hover:bg-emerald-50 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              {p.isCoHost ? (
                                <>
                                  <ShieldOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                  Un Co-Host
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  Make Co-Host
                                </>
                              )}
                            </button>
                          )}

                          {onKickParticipant && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onKickParticipant(p.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              Remove from Chat
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
