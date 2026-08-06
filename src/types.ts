export interface Participant {
  id: string;
  name: string;
  isCreator: boolean;
  isCoHost?: boolean;
  avatarColor?: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface SharedFile {
  id: string;
  name: string;
  size: number;
  type: string; // 'pdf' | 'doc' | 'txt' | 'code' | 'image' | 'other'
  url: string;
  content?: string; // Text extracted or supplied for AI
  uploadedBy: string;
  uploadedAt: string;
  isPrivate?: boolean;
}


export interface AIAnalysis {
  id: string;
  type: 'query';
  fileName?: string;
  title: string;
  content: string; // Markdown or plain text
  createdAt: string;
  isPrivate?: boolean;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // user names who reacted
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarColor?: string;
  senderAvatarUrl?: string;
  isCreator: boolean;
  isAI?: boolean;
  text: string;
  fileAttachment?: SharedFile;
  aiAnalysis?: AIAnalysis;
  timestamp: string;
  reactions?: Reaction[];
}

export interface RoomSession {
  id: string; // Chat ID e.g. QC-924-ALPHA
  password?: string;
  creatorId: string;
  durationHours: number; // e.g. 0.5, 1, 4, 12, 24
  isManualEnd: boolean;
  allowStudentChat?: boolean; // Controls whether non-hosts can send chat messages
  allowStudentAi?: boolean; // Controls whether non-hosts can use AI features
  isLocked?: boolean; // Lock room from new participants
  createdAt: string;
  expiresAt: string; // ISO string
  participants: Participant[];
  messages: ChatMessage[];
  files: SharedFile[];
  aiHistory: AIAnalysis[];
  aiFiles: SharedFile[];
}
