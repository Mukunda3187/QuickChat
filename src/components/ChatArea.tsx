import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SharedFile } from '../types';
import { Send, Paperclip, Sparkles, FileText, Download, CheckCircle2, HelpCircle, FileCheck, Lock, Smile } from 'lucide-react';
import { CuteBotIcon } from './CuteBotIcon';

interface ChatAreaProps {
  messages: ChatMessage[];
  currentUserId: string;
  isCreator?: boolean;
  allowStudentChat?: boolean;
  onSendMessage: (text: string, fileAttachment?: SharedFile) => void;
  onUploadAndAttach: (file: File) => void;
  onOpenQuiz: (message: ChatMessage) => void;
  onOpenNotes: (message: ChatMessage) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  isAiThinking: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  currentUserId,
  isCreator = false,
  allowStudentChat = true,
  onSendMessage,
  onUploadAndAttach,
  onOpenQuiz,
  onOpenNotes,
  onReactToMessage,
  isAiThinking,
}) => {
  const [inputText, setInputText] = useState('');
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '👏', '🎉'];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiThinking]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadAndAttach(e.target.files[0]);
      e.target.value = '';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-emerald-50/20 dark:bg-zinc-950 relative h-full overflow-hidden transition-colors">
      {/* Messages Scroll Area */}
     <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">

        {messages.map((msg) => {
          if (msg.senderId === 'system') {
            return (
          <div key={msg.id} className="flex justify-center w-full my-2">
                <div className="w-fit max-w-lg mx-auto text-[11px] font-semibold text-emerald-900 dark:text-zinc-400 bg-emerald-100/60 dark:bg-zinc-900 px-4 py-2 rounded-full border border-emerald-200/80 dark:border-zinc-800 text-center">
                  {msg.text}
                </div>
              </div>
            );
          }

          const isMe = msg.senderId === currentUserId;

          return (
            <div key={msg.id} className={`flex gap-3 group relative ${isMe ? 'flex-row-reverse' : ''}`}>
              {msg.senderAvatarUrl ? (
                <img
                  src={msg.senderAvatarUrl}
                  alt={msg.senderName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 border border-emerald-400 dark:border-zinc-700 shadow-xs"
                />
              ) : msg.senderAvatarColor ? (
                <div
                  style={{ backgroundColor: msg.senderAvatarColor }}
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white font-black text-xs shadow-xs border border-white/30"
                >
                  {msg.senderName ? msg.senderName.substring(0, 2).toUpperCase() : 'U'}
                </div>
              ) : (
                <div
                  className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                    isMe
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black shadow-xs dark:shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : 'bg-emerald-100 dark:bg-zinc-800 text-emerald-950 dark:text-zinc-200 border border-emerald-200 dark:border-zinc-700'
                  }`}
                >
                  {msg.senderName ? msg.senderName.substring(0, 2).toUpperCase() : 'U'}
                </div>
              )}

              <div className={`max-w-md ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className="relative group/msg">
                  <div
                    className={`p-3 rounded-2xl text-sm shadow-2xs ${
                      isMe
                        ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black font-semibold rounded-tr-none'
                        : 'bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-tl-none border border-emerald-200/80 dark:border-zinc-800'
                    }`}
                  >
                    {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                    {msg.fileAttachment && (
                      <div
                        className={`mt-2 p-2 rounded-xl flex items-center gap-2 border text-xs ${
                          isMe
                            ? 'bg-emerald-700/60 border-emerald-500/50 text-white dark:bg-emerald-600/80 dark:text-black dark:border-emerald-400'
                            : 'bg-emerald-50/80 dark:bg-zinc-800 border-emerald-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200'
                        }`}
                      >
                        <FileText className="w-4 h-4 shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p className="font-bold truncate">{msg.fileAttachment.name}</p>
                          <p className={`text-[10px] ${isMe ? 'text-emerald-100 dark:text-emerald-950' : 'text-slate-500 dark:text-zinc-400'}`}>
                            {msg.fileAttachment.type.toUpperCase()}
                          </p>
                        </div>
                        <a
                          href={msg.fileAttachment.url}
                          download={msg.fileAttachment.name}
                          className={`p-1 rounded hover:bg-black/10 ${isMe ? 'text-white dark:text-black' : 'text-slate-600 dark:text-zinc-400'}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Reaction Button & Bar on Hover */}
                  {onReactToMessage && (
                    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 ${isMe ? '-left-8' : '-right-8'}`}>
                      <button
                        type="button"
                        onClick={() => setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)}
                        className="opacity-0 group-hover/msg:opacity-100 p-1.5 rounded-full bg-white dark:bg-zinc-800 text-slate-400 hover:text-amber-500 dark:text-zinc-400 dark:hover:text-amber-400 shadow-md border border-slate-200 dark:border-zinc-700 transition-all cursor-pointer"
                        title="React to message"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Quick Reaction Picker Bar */}
                  {activeReactionMsgId === msg.id && onReactToMessage && (
                    <div className={`absolute bottom-full mb-1 ${isMe ? 'right-0' : 'left-0'} bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl p-1.5 shadow-xl flex items-center gap-1 z-30 animate-in fade-in zoom-in-95 duration-100`}>
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            onReactToMessage(msg.id, emoji);
                            setActiveReactionMsgId(null);
                          }}
                          className="hover:scale-125 transition-transform p-1 text-base cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reaction Pill Badges */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    {msg.reactions.map((r) => (
                      <button
                        key={r.emoji}
                        type="button"
                        onClick={() => onReactToMessage && onReactToMessage(msg.id, r.emoji)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-zinc-700 transition-all cursor-pointer shadow-2xs"
                        title={r.users ? r.users.join(', ') : ''}
                      >
                        <span>{r.emoji}</span>
                        <span>{r.count}</span>
                      </button>
                    ))}
                  </div>
                )}

                <span className={`text-[10px] text-slate-500 dark:text-zinc-500 mt-1 block font-medium ${isMe ? 'text-right' : 'text-left'}`}>
                  {msg.senderName} • {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}

        {isAiThinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 shrink-0 flex items-center justify-center text-white dark:text-black shadow-md">
              <CuteBotIcon className="w-5 h-5 animate-bounce" />
            </div>
            <div className="bg-white dark:bg-zinc-900 border border-emerald-300/80 dark:border-emerald-900/60 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-900 dark:text-emerald-300 font-bold shadow-xs">
              <CuteBotIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              AI is analyzing response...
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Message Input Bar or Host Disabled Banner */}
      <div className="h-20 bg-white/95 dark:bg-zinc-950 border-t border-emerald-200/80 dark:border-zinc-800 px-4 md:px-6 flex items-center justify-center gap-3 shrink-0 backdrop-blur-md">
        {!allowStudentChat && !isCreator ? (
          <div className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Host disabled chat.</span>
          </div>
        ) : (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              className="hidden"
            />

            <div className="flex-1 flex items-center gap-3 bg-emerald-50/60 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl px-4 py-2.5 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                title="Add file"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-slate-900 dark:text-zinc-100 w-full placeholder:text-slate-400 dark:placeholder:text-zinc-500"
              />

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black disabled:opacity-40 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-md dark:shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
