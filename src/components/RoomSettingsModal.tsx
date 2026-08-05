import React, { useState, useEffect } from 'react';
import { Settings, Shield, MessageSquare, Bot, Clock, User, Sun, Moon, X, Check, Lock, Unlock, Palette, LogOut, Power, AlertTriangle, KeyRound, RefreshCw, Pencil, Upload, Trash2 } from 'lucide-react';
import { CuteBotIcon } from './CuteBotIcon';

export type ThemeColor = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber' | 'cyan';

interface RoomSettingsModalProps {
  isCreator: boolean;
  isCoHost?: boolean;
  currentUserName: string;
  currentRoomId?: string;
  currentPassword?: string;
  currentAvatarColor?: string;
  currentAvatarUrl?: string;
  allowStudentChat: boolean;
  allowStudentAi: boolean;
  isLocked?: boolean;
  hasCoHosts?: boolean;
  theme: 'light' | 'dark';
  themeColor: ThemeColor;
  onSaveHostSettings: (data: {
    allowStudentChat: boolean;
    allowStudentAi: boolean;
    isLocked: boolean;
    hostName: string;
    avatarColor?: string;
    avatarUrl?: string;
    newChatId?: string;
    newPassword?: string;
  }) => Promise<void>;
  onSaveStudentSettings: (data: {
    newName: string;
    avatarColor?: string;
    avatarUrl?: string;
  }) => Promise<void>;
  onToggleTheme: () => void;
  onChangeThemeColor: (color: ThemeColor) => void;
  onLeaveSession: () => void;
  onEndSession: () => void;
  onClose: () => void;
}

export const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({
  isCreator,
  isCoHost,
  currentUserName,
  currentRoomId = '',
  currentPassword = '',
  currentAvatarColor = '#10b981',
  currentAvatarUrl = '',
  allowStudentChat: initialAllowStudentChat,
  allowStudentAi: initialAllowStudentAi,
  isLocked: initialIsLocked = false,
  hasCoHosts = false,
  theme,
  themeColor,
  onSaveHostSettings,
  onSaveStudentSettings,
  onToggleTheme,
  onChangeThemeColor,
  onLeaveSession,
  onEndSession,
  onClose,
}) => {
  const [allowStudentChat, setAllowStudentChat] = useState<boolean>(initialAllowStudentChat);
  const [allowStudentAi, setAllowStudentAi] = useState<boolean>(initialAllowStudentAi);
  const [isLocked, setIsLocked] = useState<boolean>(initialIsLocked);
  const [displayName, setDisplayName] = useState<string>(currentUserName);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>(currentRoomId);
  const [sessionPassword, setSessionPassword] = useState<string>(currentPassword);
  const [avatarColor, setAvatarColor] = useState<string>(currentAvatarColor || '#10b981');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentAvatarUrl || '');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const canManageHost = isCreator || isCoHost;

  const presetAvatarColors = [
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Cyan', hex: '#06b6d4' },
    { name: 'Pink', hex: '#ec4899' },
    { name: 'Indigo', hex: '#6366f1' },
    { name: 'Teal', hex: '#14b8a6' },
    { name: 'Slate', hex: '#64748b' },
  ];

  const generateRandomSessionId = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'QC-';
    for (let i = 0; i < 3; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    res += '-';
    for (let i = 0; i < 4; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    setSessionId(res);
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSessionPassword(pass);
  };

  const colors: { id: ThemeColor; name: string; hex: string }[] = [
    { id: 'emerald', name: 'Emerald', hex: '#10b981' },
    { id: 'blue', name: 'Blue', hex: '#3b82f6' },
    { id: 'purple', name: 'Purple', hex: '#a855f7' },
    { id: 'rose', name: 'Rose', hex: '#f43f5e' },
    { id: 'amber', name: 'Amber', hex: '#f59e0b' },
    { id: 'cyan', name: 'Teal', hex: '#06b6d4' },
  ];

  const handleSave = async () => {
    setValidationError('');
    setIsSaving(true);
    try {
      if (canManageHost) {
        const cleanId = sessionId.trim().toUpperCase();
        const cleanPwd = sessionPassword.trim();

        if (!cleanId) {
          setValidationError('Session ID cannot be empty.');
          setIsSaving(false);
          return;
        }

        if (cleanPwd.length < 7) {
          setValidationError('Room password must be at least 7 characters long.');
          setIsSaving(false);
          return;
        }

        await onSaveHostSettings({
          allowStudentChat,
          allowStudentAi,
          isLocked,
          hostName: displayName,
          avatarColor,
          avatarUrl,
          newChatId: cleanId !== currentRoomId ? cleanId : undefined,
          newPassword: cleanPwd !== currentPassword ? cleanPwd : undefined,
        });
      } else {
        await onSaveStudentSettings({
          newName: displayName,
          avatarColor,
          avatarUrl,
        });
      }
      onClose();
    } catch (e: any) {
      console.error('Failed to save settings:', e);
      setValidationError(e.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/50 dark:bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 font-sans transition-colors">
      <div className="bg-white dark:bg-zinc-950 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-zinc-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 text-black rounded-2xl flex items-center justify-center shadow-lg font-black">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {isCreator ? 'Host Settings' : 'Participant Settings'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950/60">
          {validationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Chat Icon & Profile Customization Card */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-extrabold text-sm">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Profile</span>
              </div>
            </div>

            {/* Circle attached with pencil on its perimeter + Display Name with pencil on side */}
            <div className="flex items-center gap-4">
              {/* Circle attached with pencil on its perimeter */}
              <div className="relative inline-block group shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                  className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-500 dark:border-emerald-400 shadow-md flex items-center justify-center cursor-pointer hover:opacity-90 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  title="customize chat icon"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      style={{
  backgroundColor:avatarColor
}}
                      className="w-full h-full flex items-center justify-center text-white font-black text-xl shadow-inner"
                    >
                      {displayName ? displayName.substring(0, 2).toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

                {/* Pencil Button Attached to Circle Perimeter */}
                <button
                  type="button"
                  onClick={() => setIsAvatarPickerOpen(!isAvatarPickerOpen)}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black rounded-full border-2 border-white dark:border-zinc-900 shadow-md cursor-pointer transition-transform hover:scale-110 flex items-center justify-center"
                  title="Edit chat icon"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Name with Pencil Mark on Side to edit right here */}
              <div className="flex-1 space-y-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Name
                </label>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setIsEditingName(false);
                      }}
                      autoFocus
                      placeholder="Enter name..."
                      className="flex-1 text-xs font-bold bg-slate-100/80 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2 px-3 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="p-2 bg-emerald-600 text-white dark:bg-emerald-500 dark:text-black rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shrink-0"
                      title="Done"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-800 dark:text-zinc-100 truncate">
                      {displayName || 'User Profile'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-500 hover:text-emerald-600 dark:text-zinc-400 dark:hover:text-emerald-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800"
                      title="Edit Name"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Form displaying down below when pencil or circle is clicked */}
            {isAvatarPickerOpen && (
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
                {/* Line 1: Diff Colors */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                    Choose Icon Color
                  </label>
                  <div className="flex items-center gap-2 flex-wrap py-1">
                    {presetAvatarColors.map((color) => {
                      const isSelected = !avatarUrl && avatarColor === color.hex;
                      return (
                        <button
                          key={color.hex}
                          type="button"
                          onClick={() => {
                            setAvatarColor(color.hex);
                            setAvatarUrl(''); // Switch back to color circle mode
                          }}
                          className={`w-7 h-7 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-xs ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-zinc-900 scale-110'
                              : 'hover:scale-105 opacity-85 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Down Line: Import Pic Option */}
                <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                    Import Image
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="px-3.5 py-2 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-2">
                      <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Select Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.size > 5 * 1024 * 1024) {
                              setValidationError('Image file size must be less than 5MB.');
                              return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setAvatarUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </label>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setAvatarUrl('')}
                        className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove IMG</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Session ID & Room Password edit inside this box for Host/Co-Host */}
            {canManageHost && (
              <div className="pt-3 border-t border-slate-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-extrabold text-xs">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>ID & Password</span>
                </div>

                {/* Edit Session ID */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                      Room ID
                    </label>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal">All uppercase</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={sessionId}
                      onChange={(e) => setSessionId(e.target.value.toUpperCase())}
                      placeholder="e.g. Quick-chat-ai"
                      className="flex-1 text-xs font-mono font-bold bg-slate-100/80 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 px-3 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={generateRandomSessionId}
                      className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="Generate random room ID"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Random ID</span>
                    </button>
                  </div>
                </div>

                {/* Edit Session Password */}
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
                      value={sessionPassword}
                      onChange={(e) => setSessionPassword(e.target.value)}
                      placeholder="Min. 7 characters password"
                      className="flex-1 text-xs font-mono font-bold bg-slate-100/80 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-2.5 px-3 text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={generateRandomPassword}
                      className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                      title="Generate random 8-char password"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Random Pass</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme & Color Customization (For Both Host & Students) */}
          <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-zinc-100 font-extrabold text-sm">
                <Palette className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Theme</span>
              </div>
              {/* Day / Night Toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200 transition-colors cursor-pointer border border-slate-200 dark:border-zinc-700"
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
            </div>

            {/* Accent Theme Color Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-600 dark:text-zinc-400">
                Theme Colors
              </label>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onChangeThemeColor(c.id)}
                    style={{ backgroundColor: c.hex }}
                    className={`h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                      themeColor === c.id
                        ? 'ring-2 ring-slate-900 dark:ring-white scale-105 shadow-md border-white'
                        : 'opacity-70 hover:opacity-100 border-transparent'
                    }`}
                    title={c.name}
                  >
                    {themeColor === c.id && <Check className="w-4 h-4 text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Teacher/Host Administrative Controls */}
          {canManageHost ? (
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Host Controls
              </h3>

              {/* Lock Chat / Room Switch */}

              {/* Lock Chat / Room Switch */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0">
                    {isLocked ? <Lock className="w-5 h-5 text-rose-500" /> : <Unlock className="w-5 h-5 text-emerald-500" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-zinc-100">
                      Lock Chat
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium leading-tight">
                      Prevent new members from joining
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLocked(!isLocked)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    isLocked ? 'bg-rose-500' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isLocked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Student Chat Permission */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-zinc-100">
                      Participants Chat Access
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium leading-tight">
                      Allow participants to post messages in the chat room.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAllowStudentChat(!allowStudentChat)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    allowStudentChat ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      allowStudentChat ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Student AI Permission */}
              <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 shrink-0">
                    <CuteBotIcon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-zinc-100">
                      AI Assistant Access
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 font-medium leading-tight">
                      Enable or disable AI Document Assistant for the room.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAllowStudentAi(!allowStudentAi)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    allowStudentAi ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      allowStudentAi ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Side by side Leave / End session controls */}
              <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-2">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-zinc-300">Session Actions</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={onLeaveSession}
                    className="w-full py-2.5 px-3 bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 rounded-xl text-xs font-black border border-rose-300 dark:border-rose-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Leave Room
                  </button>
                  <button
                    type="button"
                    onClick={onEndSession}
                    className="w-full py-2.5 px-3 bg-rose-600 text-white hover:bg-rose-700 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Power className="w-4 h-4" />
                    End Room
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Student Permission Summary Cards */
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Host Room Policy
              </h3>
              <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                  <MessageSquare className="w-4 h-4 text-slate-500" /> Chat Messaging
                </span>
                {initialAllowStudentChat ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px]">
                    Enabled by Host
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Disabled by Host
                  </span>
                )}
              </div>

              <div className="bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
                  <Bot className="w-4 h-4 text-slate-500" /> AI Document Assistant
                </span>
                {initialAllowStudentAi ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px]">
                    Enabled by Host
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Disabled by Host
                  </span>
                )}
              </div>

              {/* Student Leave Session Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLeaveSession}
                  className="w-full py-2.5 px-3 bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 rounded-xl text-xs font-black border border-rose-300 dark:border-rose-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Room
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-slate-200/80 dark:border-zinc-800 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:text-black dark:hover:bg-emerald-400 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isSaving ? 'Applying...' : 'Apply Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
