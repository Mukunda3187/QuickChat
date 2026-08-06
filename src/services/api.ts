import { RoomSession, ChatMessage, SharedFile, Participant } from '../types';

const BROADCAST_CHANNEL_NAME = 'quickchat_ai_channel';
let broadcastChannel: BroadcastChannel | null = null;

try {
  broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment', e);
}

export function subscribeToRoomBroadcast(callback: (event: { type: string; payload: any }) => void) {
  if (!broadcastChannel) return () => {};
  const handler = (event: MessageEvent) => {
    if (event.data) {
      callback(event.data);
    }
  };
  broadcastChannel.addEventListener('message', handler);
  return () => {
    broadcastChannel?.removeEventListener('message', handler);
  };
}

export function emitRoomBroadcast(type: string, payload: any) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, payload });
    } catch (e) {
      console.warn('Failed to broadcast room event', e);
    }
  }
}

export async function createRoomApi(data: {
  chatId: string;
  password: string;
  creatorName: string;
}) {
  const res = await fetch('/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to create room');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId: json.room.id });
  return json as { success: boolean; room: RoomSession; user: Participant };
}

export async function joinRoomApi(data: {
  chatId: string;
  password: string;
  participantName: string;
}) {
  const res = await fetch('/api/rooms/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to join room');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId: json.room.id });
  return json as { success: boolean; room: RoomSession; user: Participant };
}

export async function getRoomApi(roomId: string) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to fetch room');
  }
  return json as RoomSession;
}

export async function sendMessageApi(roomId: string, messageData: {
  senderId: string;
  senderName: string;
  isCreator: boolean;
  text: string;
  fileAttachment?: SharedFile;
}) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messageData),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to send message');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId });
  return json as { success: boolean; message: ChatMessage };
}

export async function uploadFileApi(roomId: string, fileData: {
  name: string;
  size: number;
  type: string;
  url: string;
  content?: string;
  uploadedBy: string;
}) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fileData),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to upload file');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId });
  return json as { success: boolean; file: SharedFile };
}

export async function endSessionApi(roomId: string) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/end`, {
    method: 'POST',
  });
  const json = await res.json();
  emitRoomBroadcast('SESSION_DESTROYED', { roomId });
  return json;
}

export async function updateRoomSettingsApi(roomId: string, data: {
  allowStudentChat?: boolean;
  allowStudentAi?: boolean;
  isLocked?: boolean;
  addDurationHours?: number;
  hostName?: string;
  avatarColor?: string;
  avatarUrl?: string;
  newChatId?: string;
  newPassword?: string;
  requesterId: string;
}) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to update settings');
  }
  const activeRoomId = json.newRoomId || roomId;
  emitRoomBroadcast('ROOM_UPDATED', { roomId: activeRoomId, oldRoomId: roomId });
  return json as {
    success: boolean;
    newRoomId?: string;
    password?: string;
    allowStudentChat: boolean;
    allowStudentAi: boolean;
    isLocked: boolean;
    expiresAt: string;
  };
}

export async function toggleCoHostApi(
  roomId: string,
  targetIdOrData: string | { requesterId: string; targetId: string; isCoHost: boolean },
  isCoHost?: boolean,
  requesterId?: string
) {
  const payload = typeof targetIdOrData === 'string'
    ? { requesterId: requesterId!, targetId: targetIdOrData, isCoHost: isCoHost! }
    : targetIdOrData;

  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/cohost`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to update co-host status');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId });
  return json as { success: boolean; participant: Participant };
}

export async function kickParticipantApi(
  roomId: string,
  targetIdOrData: string | { requesterId: string; targetId: string },
  requesterId?: string
) {
  const payload = typeof targetIdOrData === 'string'
    ? { requesterId: requesterId!, targetId: targetIdOrData }
    : targetIdOrData;

  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/kick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to remove participant');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId });
  return json as { success: boolean; removedId: string };
}

export async function leaveRoomApi(roomId: string, participantId: string) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ participantId }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to leave room');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId });
  return json as { success: boolean; leftUser: Participant };
}

export async function updateParticipantNameApi(roomId: string, data: {
  participantId: string;
  newName?: string;
  avatarColor?: string;
  avatarUrl?: string;
}) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/participant/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to update name');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId });
  return json as { success: boolean; participant: Participant };
}

export async function reactToMessageApi(roomId: string, messageId: string, data: {
  userName: string;
  emoji: string;
}) {
  const res = await fetch(`/api/rooms/${encodeURIComponent(roomId)}/messages/${encodeURIComponent(messageId)}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to react to message');
  }
  emitRoomBroadcast('ROOM_UPDATED', { roomId });
  return json as { success: boolean; reactions: any[] };
}

export async function requestAIAnalysisApi(data: {
  roomId: string;
  action: 'query';
  fileName?: string;
  fileContent?: string;
  prompt?: string;
  isPrivate?: boolean;
}) {
  const res = await fetch('/api/ai/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error || 'Failed to process AI analysis');
  }
  if (!data.isPrivate) {
    emitRoomBroadcast('ROOM_UPDATED', { roomId: data.roomId });
  }
  return json as { success: boolean; result: AIAnalysis };
}
