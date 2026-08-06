import React, { useState, useEffect, useCallback } from 'react';
import { RoomSession, Participant, SharedFile, ChatMessage, AIAnalysis } from './types';
import {
  createRoomApi,
  joinRoomApi,
  getRoomApi,
  sendMessageApi,
  uploadFileApi,
  endSessionApi,
  requestAIAnalysisApi,
  updateRoomSettingsApi,
  updateParticipantNameApi,
  reactToMessageApi,
  toggleCoHostApi,
  kickParticipantApi,
  leaveRoomApi,
  subscribeToRoomBroadcast,
} from './services/api';
import { Sparkles, Users, Power, AlertTriangle, File } from 'lucide-react';
import { CuteBotIcon } from './components/CuteBotIcon';
import { Header } from './components/Header';
import { ParticipantsPanel } from './components/ParticipantsPanel';
import { SharedFilesPanel } from './components/SharedFilesPanel';
import { ChatArea } from './components/ChatArea';
import { AIInsightsPanel } from './components/AIInsightsPanel';
import { RoomEntryModal } from './components/RoomEntryModal';
import { RoomSettingsModal, ThemeColor } from './components/RoomSettingsModal';

export default function App() {
  const [currentRoom, setCurrentRoom] = useState<RoomSession | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [entryError, setEntryError] = useState<string>('');
  const [isEntryLoading, setIsEntryLoading] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [activeLeftPanel, setActiveLeftPanel] = useState<'participants' | 'files' | null>(null);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [privateAiHistory, setPrivateAiHistory] = useState<AIAnalysis[]>([]);

  // Theme state: 'light' (Day Theme) or 'dark' (Dark Theme)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('quickchat_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const [themeColor, setThemeColor] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem('quickchat_theme_color');
    return (saved as ThemeColor) || 'emerald';
  });

  useEffect(() => {
    localStorage.setItem('quickchat_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('quickchat_theme_color', themeColor);
    document.documentElement.setAttribute('data-theme-color', themeColor);
  }, [themeColor]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleChangeThemeColor = (color: ThemeColor) => {
    setThemeColor(color);
  };

  // Active Modals
  const [hostNoticeMessage, setHostNoticeMessage] = useState<string | null>(null);

  useEffect(() => {
    if (hostNoticeMessage) {
      const timer = setTimeout(() => {
        setHostNoticeMessage(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hostNoticeMessage]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedRoomId = localStorage.getItem('quickchat_active_room_id');
    const savedUser = localStorage.getItem('quickchat_active_user');

    if (savedRoomId && savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        getRoomApi(savedRoomId)
          .then((room) => {
            setCurrentRoom(room);
            // Sync user object with room's updated participant list (e.g. co-host or host transfer)
            const matchedUser = room.participants.find((p) => p.id === userObj.id);
            setCurrentUser(matchedUser || userObj);
          })
          .catch(() => {
            // Room expired or wiped
            localStorage.removeItem('quickchat_active_room_id');
            localStorage.removeItem('quickchat_active_user');
          });
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  }, []);

  // Poll room updates & subscribe to BroadcastChannel
  const refreshRoom = useCallback(async () => {
    if (!currentRoom || !currentUser) return;
    try {
      const room = await getRoomApi(currentRoom.id);
      setCurrentRoom(room);

      // Check if current user is still in participants (not kicked)
      const meInRoom = room.participants.find((p) => p.id === currentUser.id);
      if (!meInRoom) {
        handleClearSession('You have been removed from the session by the host.');
        return;
      }
      // Sync currentUser flags (e.g., host role transfer or co-host status)
      setCurrentUser(meInRoom);
    } catch (e) {
      // Session ended or auto-destructed
      handleClearSession('Room session has auto-destructed.');
    }
  }, [currentRoom, currentUser]);

  useEffect(() => {
    if (!currentRoom) return;

    // Polling every 3 seconds
    const interval = setInterval(() => {
      refreshRoom();
    }, 3000);

    // BroadcastChannel listener
    const unsubscribe = subscribeToRoomBroadcast((event) => {
      if (event.payload?.roomId === currentRoom.id || event.payload?.oldRoomId === currentRoom.id) {
        if (event.type === 'SESSION_DESTROYED') {
          handleClearSession('The room session was permanently destroyed by the host.');
        } else {
          if (event.payload?.roomId && event.payload.roomId !== currentRoom.id) {
            localStorage.setItem('quickchat_active_room_id', event.payload.roomId);
            getRoomApi(event.payload.roomId).then((room) => setCurrentRoom(room)).catch(() => refreshRoom());
          } else {
            refreshRoom();
          }
        }
      }
    });
    
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [currentRoom, refreshRoom]);

  const handleClearSession = (_msg?: string) => {
    setCurrentRoom(null);
    setCurrentUser(null);
    setPrivateAiHistory([]);
    localStorage.removeItem('quickchat_active_room_id');
    localStorage.removeItem('quickchat_active_user');
    setEntryError('');
  };

  // Create Room Handler
  const handleCreateRoom = async (data: {
    chatId: string;
    password: string;
    creatorName: string;
  }) => {
    setIsEntryLoading(true);
    setEntryError('');
    try {
      const res = await createRoomApi(data);
      setCurrentRoom(res.room);
      setCurrentUser(res.user);
      localStorage.setItem('quickchat_active_room_id', res.room.id);
      localStorage.setItem('quickchat_active_user', JSON.stringify(res.user));
    } catch (err: any) {
      setEntryError(err.message || 'Failed to create room.');
    } finally {
      setIsEntryLoading(false);
    }
  };

  // Join Room Handler
  const handleJoinRoom = async (data: {
    chatId: string;
    password: string;
    participantName: string;
  }) => {
    setIsEntryLoading(true);
    setEntryError('');
    try {
      const res = await joinRoomApi(data);
      setCurrentRoom(res.room);
      setCurrentUser(res.user);
      localStorage.setItem('quickchat_active_room_id', res.room.id);
      localStorage.setItem('quickchat_active_user', JSON.stringify(res.user));
    } catch (err: any) {
      setEntryError(err.message || 'Failed to join room.');
    } finally {
      setIsEntryLoading(false);
    }
  };

  // Update Host Settings Handler
  const handleSaveHostSettings = async (data: {
    allowStudentChat: boolean;
    allowStudentAi: boolean;
    isLocked: boolean;
    hostName: string;
    avatarColor?: string;
    avatarUrl?: string;
    newChatId?: string;
    newPassword?: string;
  }) => {
    if (!currentRoom || !currentUser) return;
    const res = await updateRoomSettingsApi(currentRoom.id, {
      allowStudentChat: data.allowStudentChat,
      allowStudentAi: data.allowStudentAi,
      isLocked: data.isLocked,
      hostName: data.hostName,
      avatarColor: data.avatarColor,
      avatarUrl: data.avatarUrl,
      newChatId: data.newChatId,
      newPassword: data.newPassword,
      requesterId: currentUser.id,
    });

    const updatedUser = {
      ...currentUser,
      name: data.hostName ? data.hostName.trim() : currentUser.name,
      avatarColor: data.avatarColor ?? currentUser.avatarColor,
      avatarUrl: data.avatarUrl ?? currentUser.avatarUrl,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('quickchat_active_user', JSON.stringify(updatedUser));

    if (res.newRoomId && res.newRoomId !== currentRoom.id) {
      localStorage.setItem('quickchat_active_room_id', res.newRoomId);
      try {
        const updated = await getRoomApi(res.newRoomId);
        setCurrentRoom(updated);
      } catch (e) {
        refreshRoom();
      }
    } else {
      refreshRoom();
    }
  };

  // Update Student Settings Handler
  const handleSaveStudentSettings = async (data: {
    newName: string;
    avatarColor?: string;
    avatarUrl?: string;
  }) => {
    if (!currentRoom || !currentUser) return;
    const cleanName = data.newName ? data.newName.trim() : currentUser.name;
    await updateParticipantNameApi(currentRoom.id, {
      participantId: currentUser.id,
      newName: cleanName,
      avatarColor: data.avatarColor,
      avatarUrl: data.avatarUrl,
    });
    const updatedUser = {
      ...currentUser,
      name: cleanName,
      avatarColor: data.avatarColor ?? currentUser.avatarColor,
      avatarUrl: data.avatarUrl ?? currentUser.avatarUrl,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('quickchat_active_user', JSON.stringify(updatedUser));
    refreshRoom();
  };

  // Toggle Co-Host Status Handler
  const handleToggleCoHost = async (targetId: string, isCoHost: boolean) => {
    if (!currentRoom || !currentUser) return;
    try {
      await toggleCoHostApi(currentRoom.id, targetId, isCoHost, currentUser.id);
      refreshRoom();
    } catch (e: any) {
      alert(e.message || 'Failed to update co-host status.');
    }
  };

  // Kick Participant Handler
  const handleKickParticipant = async (targetId: string) => {
    if (!currentRoom || !currentUser) return;
    try {
      await kickParticipantApi(currentRoom.id, targetId, currentUser.id);
      refreshRoom();
    } catch (e: any) {
      alert(e.message || 'Failed to remove participant.');
    }
  };

  // Leave Session Handler
  const handleLeaveSession = async () => {
    if (!currentRoom || !currentUser) return;
    if (currentUser.isCreator) {
      const coHosts = currentRoom.participants.filter((p) => p.id !== currentUser.id && p.isCoHost);
      if (coHosts.length === 0) {
        setIsSettingsOpen(false);
        setHostNoticeMessage("Due to no existing Co-Host, you cannot leave the chat. As Host, you can only end the meeting.");
        return;
      }
    }
    try {
      await leaveRoomApi(currentRoom.id, currentUser.id);
    } catch (e: any) {
      console.error('Error leaving room:', e);
    } finally {
      setIsSettingsOpen(false);
      handleClearSession();
    }
  };

  // React to Message Handler
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    if (!currentRoom || !currentUser) return;
    try {
      await reactToMessageApi(currentRoom.id, messageId, {
        userName: currentUser.name,
        emoji,
      });
      refreshRoom();
    } catch (e) {
      console.error('Failed to react to message', e);
    }
  };

  // Send Chat Message Handler
  const handleSendMessage = async (text: string, fileAttachment?: SharedFile) => {
    if (!currentRoom || !currentUser) return;

    // Check if user is explicitly asking AI via @AI, ai:, ask ai, /ai, etc.
    const trimmed = text.trim().toLowerCase();
    const isAiQuestion =
      trimmed.includes('@ai') ||
      trimmed.startsWith('ai:') ||
      trimmed.startsWith('ai,') ||
      trimmed.startsWith('ask ai') ||
      trimmed.startsWith('/ai') ||
      trimmed.startsWith('hey ai');

    try {
      await sendMessageApi(currentRoom.id, {
        senderId: currentUser.id,
        senderName: currentUser.name,
        isCreator: currentUser.isCreator,
        text,
        fileAttachment,
      });

      refreshRoom();

      if (isAiQuestion) {
        if (currentRoom.allowStudentAi === false) {
          alert("AI Assistant has been disabled for this room by the Host.");
          return;
        }

        setIsAiThinking(true);
        // Find latest file content if available
        const latestFile = currentRoom.files[currentRoom.files.length - 1];
        const cleanPrompt = text
          .replace(/@ai/gi, '')
          .replace(/^ai:/gi, '')
          .replace(/^ai,/gi, '')
          .replace(/^ask ai/gi, '')
          .replace(/^\/ai/gi, '')
          .replace(/^hey ai/gi, '')
          .trim();

        await requestAIAnalysisApi({
          roomId: currentRoom.id,
          action: 'query',
          fileName: latestFile?.name,
          fileContent: latestFile?.content,
          prompt: cleanPrompt || text,
          isCreator: currentUser.isCreator,
        });
        refreshRoom();
        setIsAiThinking(false);
      }
    } catch (e) {
      console.error('Failed to send message', e);
      setIsAiThinking(false);
    }
  };

  // Upload File Handler
  const handleUploadFile = async (file: File) => {
    if (!currentRoom || !currentUser) return;

    try {
      let fileText = '';
      if (
        file.type.includes('text') ||
        file.name.endsWith('.txt') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.md')
      ) {
        fileText = await file.text();
      } else {
        fileText = `[File: ${file.name}, Size: ${(file.size / 1024).toFixed(1)} KB, Type: ${file.type || 'Binary Document'}]`;
      }

      const fileUrl = URL.createObjectURL(file);

      let fileKind = 'doc';
      if (file.name.endsWith('.pdf')) fileKind = 'pdf';
      else if (file.type.includes('image')) fileKind = 'image';
      else if (file.name.match(/\.(js|ts|py|cpp|java|html|css|json)$/)) fileKind = 'code';
      else if (file.name.endsWith('.txt')) fileKind = 'txt';

      await uploadFileApi(currentRoom.id, {
        name: file.name,
        size: file.size,
        type: fileKind,
        url: fileUrl,
        content: fileText,
        uploadedBy: currentUser.name,
      });

      refreshRoom();
    } catch (e) {
      console.error('Failed to upload file', e);
      setIsAiThinking(false);
    }
  };

  // End Session Handler
  const handleEndSession = async () => {
    if (!currentRoom) return;
    try {
      await endSessionApi(currentRoom.id);
    } catch (e) {
      console.error('Error ending session:', e);
    } finally {
      setIsSettingsOpen(false);
      handleClearSession();
      setActiveLeftPanel(null);
      setIsAIPanelOpen(false);
      setTheme('light');
      setThemeColor('emerald');
      handleSaveHostSettings();
      refreshRoom();
      setIsSettingsOpen(false);
    }
  };

  if (!currentRoom || !currentUser) {
    return (
      <RoomEntryModal
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        error={entryError}
        isLoading={isEntryLoading}
        theme={theme}
        themeColor={themeColor}
        onToggleTheme={handleToggleTheme}
        onChangeThemeColor={handleChangeThemeColor}
      />
    );
  }
const handleTriggerAIAction = async (
  action: 'query',
  files?: SharedFile[],
  customPrompt?: string
) => {
  if (!currentRoom || !currentUser) return;

  try {
    setIsAiThinking(true);

    const file = files?.[0];

    await requestAIAnalysisApi({
      roomId: currentRoom.id,
      action: 'query',
      fileName: file?.name,
      fileContent: file?.content,
      prompt: customPrompt || '',
      isPrivate: true,
      isCreator: currentUser.isCreator,
    });

    refreshRoom();
  } finally {
    setIsAiThinking(false);
  }
};
  const hasCoHosts = currentRoom.participants.some((p) => p.isCoHost && !p.isCreator);

  return (
    <div className="flex flex-col h-screen w-screen bg-emerald-50/20 dark:bg-black font-sans overflow-hidden text-slate-900 dark:text-zinc-100 border-b border-emerald-200/50 dark:border-zinc-800">
      {/* Header Navigation */}
      <Header
        roomId={currentRoom.id}
        isCreator={currentUser.isCreator}
        isCoHost={currentUser.isCoHost}
        onEndSession={handleEndSession}
        onLeaveSession={handleLeaveSession}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Workspace */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Participants & Shared Files */}
      {!activeLeftPanel && (
  <div className="fixed left-0 top-20 z-40 flex flex-col gap-2">
  {/* Participants Button */}
  <button
    onClick={() =>
  setActiveLeftPanel(
    activeLeftPanel === 'participants'
      ? null
      : 'participants'
  )
}
    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black p-3 rounded-r-2xl shadow-xl border-r border-y border-emerald-400 cursor-pointer transition-all"
    title="Participants"
  >
    <Users className="w-5 h-5" />
  </button>

  {/* Shared Files Button */}
  <button
    onClick={() =>
  setActiveLeftPanel(
    activeLeftPanel === 'files'
      ? null
      : 'files'
  )
}
    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black p-3 rounded-r-2xl shadow-xl border-r border-y border-emerald-400 cursor-pointer transition-all"
    title="Shared Files"
  >
    <File className="w-5 h-5" />
  </button>

</div>
)}
        {activeLeftPanel === 'participants' && (
  <ParticipantsPanel
    participants={currentRoom.participants}
    currentUserId={currentUser.id}
    isCreator={currentUser.isCreator}
    isCoHost={currentUser.isCoHost}
    allowStudentAi={currentRoom.allowStudentAi ?? true}
    files={currentRoom.files}
    onUploadFile={handleUploadFile}
    onAskAIAboutFile={(file) =>
  setIsAIPanelOpen(true)
}
    onToggleCoHost={handleToggleCoHost}
    onKickParticipant={handleKickParticipant}
    onClose={() => setActiveLeftPanel(null)}
  />
)}

{activeLeftPanel === 'files' && (
  <SharedFilesPanel
    participants={currentRoom.participants}
    currentUserId={currentUser.id}
    isCreator={currentUser.isCreator}
    isCoHost={currentUser.isCoHost}
    allowStudentAi={currentRoom.allowStudentAi ?? true}
    files={currentRoom.files}
    onUploadFile={handleUploadFile}
    onAskAIAboutFile={() => setIsAIPanelOpen(true)}
    onToggleCoHost={handleToggleCoHost}
    onKickParticipant={handleKickParticipant}
    onClose={() => setActiveLeftPanel(null)}
  />
)}

        {/* Center Chat Interface */}
        <ChatArea
          messages={currentRoom.messages}
          currentUserId={currentUser.id}
          isCreator={currentUser.isCreator}
          allowStudentChat={currentRoom.allowStudentChat ?? true}
          onSendMessage={handleSendMessage}
          onUploadAndAttach={handleUploadFile}
          onReactToMessage={handleReactToMessage}
          isAiThinking={isAiThinking}
        />

        {/* Floating Side Button to Re-Open AI Assistant if Closed (Logo Only) */}
        {!isAIPanelOpen && (
          <button
            onClick={() => setIsAIPanelOpen(true)}
            className="fixed right-0 top-20 z-40 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-black p-3 rounded-l-2xl shadow-xl flex items-center justify-center transition-all cursor-pointer border-l border-y border-emerald-400 dark:border-emerald-300 animate-in slide-in-from-right duration-200"
            title="Open AI Document Assistant"
          >
            <CuteBotIcon className="w-5 h-5" />
          </button>
        )}

        {/* Right Sidebar: AI Document Assistant Insights */}
        {isAIPanelOpen && (
          <AIInsightsPanel
            files={currentRoom.files}
            aiHistory={currentRoom.aiHistory}
            privateAiHistory={privateAiHistory}
            isCreator={currentUser.isCreator}
            allowStudentAi={currentRoom.allowStudentAi ?? true}
            onTriggerAIAction={handleTriggerAIAction}
            isThinking={isAiThinking}
            onClose={() => {
                       setIsAIPanelOpen(false);
                          }}
          />
        )}
      </main>

      {/* Settings Modal (Host & Student Controls) */}
      {isSettingsOpen && (
        <RoomSettingsModal
          isCreator={currentUser.isCreator}
          isCoHost={currentUser.isCoHost}
          currentUserName={currentUser.name}
          currentRoomId={currentRoom.id}
          currentPassword={currentRoom.password}
          currentAvatarColor={currentUser.avatarColor}
          currentAvatarUrl={currentUser.avatarUrl}
          allowStudentChat={currentRoom.allowStudentChat ?? true}
          allowStudentAi={currentRoom.allowStudentAi ?? true}
          isLocked={currentRoom.isLocked ?? false}
          hasCoHosts={hasCoHosts}
          theme={theme}
          themeColor={themeColor}
          onSaveHostSettings={handleSaveHostSettings}
          onSaveStudentSettings={handleSaveStudentSettings}
          onToggleTheme={handleToggleTheme}
          onChangeThemeColor={handleChangeThemeColor}
          onLeaveSession={handleLeaveSession}
          onEndSession={handleEndSession}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Host Notice Overlay - 2 second auto dismiss, text only without any titles or buttons */}
      {hostNoticeMessage && (
        <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 font-sans animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-sm w-full border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 text-center text-xs font-bold text-slate-800 dark:text-zinc-200 leading-relaxed">
            {hostNoticeMessage}
          </div>
        </div>
      )}
    </div>
  );
}

