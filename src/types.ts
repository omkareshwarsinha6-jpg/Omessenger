import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  username: string;
  email: string;
  phone?: string;
  avatarURL?: string;
  isOnline?: boolean;
  lastSeen?: Timestamp;
  isAdmin?: boolean;
  isBanned?: boolean;
  banReason?: string;
  banExpires?: Timestamp;
  createdAt: Timestamp;
  publicKey?: string;
}

export interface Message {
  messageId: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  contentType: 'text' | 'image' | 'video' | 'file' | 'voice';
  mediaURL?: string;
  timestamp: Timestamp;
  isRead?: boolean;
  readAt?: Timestamp;
  replyTo?: string;
  reactions?: Record<string, string>;
  isDeleted?: boolean;
  deletedAt?: Timestamp;
  participants: string[];
}

export interface Chat {
  chatId: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  unreadCount?: Record<string, number>;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}
