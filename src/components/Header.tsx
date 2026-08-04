import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, Power, MessageSquare, Settings, LogOut, Users } from 'lucide-react';

interface HeaderProps {
  roomId: string;
  isCreator: boolean;
  isCoHost?: boolean;
  onEndSession: () => void;
  onLeaveSession: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  roomId,
  isCreator,
  isCoHost,
  onEndSession,
  onLeaveSession,
  onOpenSettings,
}) => {
  const [copied, setCopied] = useState(false);

  const isHostOrCoHost = isCreator || isCoHost;

  const handleCopyId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <nav className="h-16 flex items-center justify-between px-4 md:px-8 bg-white/95 dark:bg-zinc-950/95 border-b border-emerald-200/80 dark:border-zinc-800/80 shadow-xs z-10 shrink-0 backdrop-blur-md">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-xl flex items-center justify-center shadow-emerald-200 dark:shadow-[0_0_15px_rgba(16,185,129,0.35)] shadow-lg text-white dark:text-black transition-all">
          <MessageSquare className="w-5 h-5 fill-current" />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-black tracking-tight text-slate-900 dark:text-zinc-100 leading-tight">QuickChat AI</h1>
          <p className="text-[10px] uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Shield className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> Temporary Chatspace
          </p>
        </div>
      </div>

      {/* Session Metadata Badges & Action Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Settings Button (Host and Co-Host) */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer border bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700 dark:bg-emerald-500 dark:text-black dark:border-emerald-400 dark:hover:bg-emerald-400 shadow-xs"
            title={isCreator ? "Host Settings" : isCoHost ? "Co-Host Settings" : "Participant Settings"}
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        <div className="hidden sm:flex items-center gap-3 bg-emerald-50/70 dark:bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-emerald-200/80 dark:border-zinc-800">
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Room ID</span>
            <button
              onClick={handleCopyId}
              className="text-xs font-mono font-bold text-emerald-950 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 transition-colors"
              title="Copy ID"
            >
              {roomId}
              {copied ? <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400 dark:text-zinc-500" />}
            </button>
          </div>
         </div>
        {/* Leave Button (Available to Everyone) */}
        <button
          onClick={onLeaveSession}
          className="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          title="Leave this Room"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>

        {/* End Session Button (Host & Co-Host) */}
        {isHostOrCoHost && (
          <button
            onClick={onEndSession}
            className="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 px-3 py-2 rounded-xl text-xs font-bold border border-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="End Room"
          >
            <Power className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">End Room</span>
          </button>
        )}
      </div>
    </nav>
  );
};
