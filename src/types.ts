export type View = 'chats' | 'groups' | 'ai' | 'calls' | 'profile' | 'settings' | 'info';

export type Theme = 'classic' | 'twilight' | 'sunset' | 'emerald';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  bio: string;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  url: string;
  size?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  groupId?: string; // If set, this is a group message
  isAi?: boolean;   // If true, this is an AI chat message
  attachment?: Attachment;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: string[]; // User IDs
  avatar: string;
}

export interface Call {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  timestamp: string;
  duration?: number; // in seconds
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'message' | 'call' | 'group' | 'system';
  timestamp: string;
  read: boolean;
}
