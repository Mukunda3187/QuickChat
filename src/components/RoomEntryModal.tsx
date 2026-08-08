import React, { useState } from 'react';
import { MessageSquare, Lock, KeyRound, User, ArrowRight, RefreshCw, Sun, Moon, Settings, Palette, X, Check, Eye, EyeOff } from 'lucide-react';
import { ThemeColor } from './RoomSettingsModal';

interface RoomEntryModalProps {
  onCreateRoom: (data: {
    chatId: string;
    password: string;
    creatorName: string;
  }) => Promise<void>;
  onJoinRoom: (data: {
    chatId: string;
    password: string;
    participantName: string;
  }) => Promise<void>;
  error?: string;
  isLoading: boolean;
  theme?: 'light' | 'dark';
  themeColor?: ThemeColor;
  onToggleTheme?: () => void;
  onChangeThemeColor?: (color: ThemeColor) => void;
}

export const RoomEntryModal: React.FC<RoomEntryModalProps> = ({
  onCreateRoom,
  onJoinRoom,
  error,
  isLoading,
  theme = 'light',
  themeColor = 'emerald',
  onToggleTheme,
  onChangeThemeColor,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Create Form State
  const generateRandomChatId = () => {
    const prefixes = ['QC', 'LAB', 'HACK', 'MEET', 'SYNC'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(100 + Math.random() * 900);
    const alpha = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${num}-${alpha}`;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const [createChatId, setCreateChatId] = useState(generateRandomChatId());
  const [createPassword, setCreatePassword] = useState(generateRandomPassword());
  const [creatorName, setCreatorName] = useState('');

  // Join Form State
  const [joinChatId, setJoinChatId] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [showJoinPassword, setShowJoinPassword] = useState(false);
  const [participantName, setParticipantName] = useState('');
  const [localError, setLocalError] = useState<string>('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!createChatId || !createPassword || !creatorName) return;

    if (createPassword.length < 7) {
      setLocalError('Password must be at least 7 characters long.');
      return;
    }

    const hours = parseInt(customHours, 10) || 0;
    const minutes = parseInt(customMinutes, 10) || 0;
    const durationMinutes = customTimeEnabled && (hours > 0 || minutes > 0)
      ? hours * 60 + minutes
      : undefined;

    await onCreateRoom({
      chatId: createChatId,
      password: createPassword,
      creatorName,
      durationMinutes,
    });
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    if (!joinChatId || !joinPassword || !participantName) return;

    if (joinPassword.length < 7) {
      setLocalError('Password must be at least 7 characters long.');
      return;
    }

    await onJoinRoom({
      chatId: joinChatId,
      password: joinPassword,
      participantName,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-100/90 dark:bg-zinc-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans transition-colors overflow-y-auto">
      {/* Settings Button in top-right screen corner */}
      <button
        type="button"
        onClick={() => setShowSettingsModal(!showSettingsModal)}
        className="fixed top-4 right-4 z-50 p-2.5 bg-white/90 dark:bg-zinc-800/90 hover:bg-white dark:hover:bg-zinc-700 text-slate-800 dark:text-emerald-400 rounded-full border border-emerald-200 dark:border-zinc-700 backdrop-blur-md shadow-lg transition-all cursor-pointer"
        title="Appearance & Theme Settings"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Appearance & Theme Modal Overlay */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-950 rounded-3xl max-w-sm w-full border border-emerald-200 dark:border-zinc-800 shadow-2xl p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 rounded-xl">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-zinc-100">Theme</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Theme Toggle */}
            <div className="flex items-center justify-between bg-emerald-50/60 dark:bg-zinc-900 p-3 rounded-2xl border border-emerald-100 dark:border-zinc-800">
              <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Mode Theme</span>
              {onToggleTheme && (
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-xs font-extrabold text-slate-900 dark:text-zinc-100 border border-slate-200 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
                >
                  {theme === 'light' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Day Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-400" />
                      <span>Night Mode</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Accent Color Palette */}
            {onChangeThemeColor && (
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 block">
                  Theme Colors
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: 'emerald' as ThemeColor, name: 'Emerald', hex: '#10b981' },
                    { id: 'blue' as ThemeColor, name: 'Blue', hex: '#3b82f6' },
                    { id: 'purple' as ThemeColor, name: 'Purple', hex: '#a855f7' },
                    { id: 'rose' as ThemeColor, name: 'Rose', hex: '#f43f5e' },
                    { id: 'amber' as ThemeColor, name: 'Amber', hex: '#f59e0b' },
                    { id: 'cyan' as ThemeColor, name: 'Teal', hex: '#06b6d4' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => onChangeThemeColor(c.id)}
                      style={{ backgroundColor: c.hex }}
                      className={`h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                        themeColor === c.id
                          ? 'ring-2 ring-slate-900 dark:ring-white scale-105 shadow-md border-white'
                          : 'opacity-70 hover:opacity-100 border-transparent'
                      }`}
                      title={c.name}
                    >
                      {themeColor === c.id && <Check className="w-3.5 h-3.5 text-white drop-shadow-md" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400 font-extrabold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Home Screen Container Card */}
      <div className="bg-white dark:bg-zinc-950 rounded-3xl max-w-4xl w-full border border-emerald-200/80 dark:border-zinc-800 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 my-auto transition-all">
        {/* Left Side: Clean Logo and Title (No extra text, no black-green background) */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-emerald-50/70 dark:bg-zinc-900/60 flex flex-col items-center justify-center text-center border-b lg:border-b-0 lg:border-r border-emerald-200/80 dark:border-zinc-800">
          <div className="w-16 h-16 bg-emerald-600 dark:bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200/60 dark:shadow-none text-white dark:text-black mb-4">
            <MessageSquare className="w-8 h-8 fill-current" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-zinc-100">
            QuickChat AI
          </h1>
          <p className="text-xs uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold mt-1.5">
            Temporary Chatspace
          </p>
        </div>

        {/* Right Side: Clean Input Info Box Form */}
        <div className="lg:col-span-7 bg-white dark:bg-zinc-950 p-6 sm:p-8 flex flex-col justify-center">
          {/* Tab Switcher */}
          <div className="flex border border-emerald-200/80 dark:border-zinc-800 bg-emerald-50/60 dark:bg-zinc-900/80 p-1.5 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-400 shadow-xs border border-emerald-200/60 dark:border-zinc-700'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Create Room
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-400 shadow-xs border border-emerald-200/60 dark:border-zinc-700'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
              }`}
            >
              Join Room
            </button>
          </div>

          {/* Form Body */}
          {(error || localError) && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400">
              {error || localError}
            </div>
          )}

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Chat ID Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Chat Room ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={createChatId}
                    onChange={(e) => setCreateChatId(e.target.value.toUpperCase())}
                    placeholder="e.g. Quick-chat-Ai"
                    className="flex-1 text-xs font-mono font-bold bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setCreateChatId(generateRandomChatId())}
                    className="p-2.5 bg-emerald-50 dark:bg-zinc-900 hover:bg-emerald-100 dark:hover:bg-zinc-800 border border-emerald-200 dark:border-zinc-800 rounded-xl text-emerald-800 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Generate Random ID"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Room Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Room Password
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                    (Min. 7 characters)
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    minLength={7}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Enter password"
                    className="flex-1 text-xs bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setCreatePassword(generateRandomPassword())}
                    className="p-2.5 bg-emerald-50 dark:bg-zinc-900 hover:bg-emerald-100 dark:hover:bg-zinc-800 border border-emerald-200 dark:border-zinc-800 rounded-xl text-emerald-800 dark:text-emerald-400 transition-colors cursor-pointer"
                    title="Generate Random Password"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

             {/* Set Time */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Set Time
                  </label>
                  <button
                    type="button"
                    onClick={() => setCustomTimeEnabled((v) => !v)}
                    className={`w-9 h-5 rounded-full relative transition-colors cursor-pointer ${
                      customTimeEnabled ? 'bg-emerald-600 dark:bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                    }`}
                    title={customTimeEnabled ? 'Custom time: On' : 'Custom time: Off'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-xs transition-transform ${
                        customTimeEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {customTimeEnabled && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      max={23}
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      placeholder="Hours"
                      className="flex-1 text-xs bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      placeholder="Minutes"
                      className="flex-1 text-xs bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                )}

                <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                  Default time limit is 5 hours.
                </p>
              </div>

              {/* Your Nickname */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Your Name
                </label>
                <input
                  type="text"
                  required
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  placeholder="e.g. Shikamaru"
                  className="w-full text-xs bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black disabled:opacity-50 text-white py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Initializing Room...' : 'Create Temporary Room'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinSubmit} className="space-y-4">
              {/* Chat ID Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Enter Chat Room ID
                </label>
                <input
                  type="text"
                  required
                  value={joinChatId}
                  onChange={(e) => setJoinChatId(e.target.value.toUpperCase())}
                  placeholder="e.g. Quick-chat-Ai"
                  className="w-full text-xs font-mono font-bold bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Enter Room Password
                  </label>
                  <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-semibold">
                    (Min. 7 characters)
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showJoinPassword ? 'text' : 'password'}
                    required
                    minLength={7}
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    placeholder="Enter Room password"
                    className="w-full text-xs bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2.5 pr-9 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowJoinPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer"
                    title={showJoinPassword ? 'Hide password' : 'Show password'}
                  >
                    {showJoinPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Your Name
                </label>
                <input
                  type="text"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="e.g .Gaara"
                  className="w-full text-xs bg-emerald-50/50 dark:bg-zinc-900 border border-emerald-200/80 dark:border-zinc-800 rounded-xl p-2.5 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:text-black disabled:opacity-50 text-white py-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? 'Joining Room...' : 'Join Room'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
