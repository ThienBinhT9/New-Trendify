// ============================================================================
// ENUMS
// ============================================================================

export enum EMessageType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  FILE = "file",
  GIF = "gif",
  STICKER = "sticker",
  VOICE = "voice",
  SYSTEM = "system",
}

export enum EMessageStatus {
  SENT = "sent",
  DELIVERED = "delivered",
  SEEN = "seen",
}

// ============================================================================
// REACTION
// ============================================================================

export const MESSAGE_REACTION_EMOJIS = ["❤️", "😆", "😮", "😢", "😡", "👍"] as const;

export type MessageReactionEmoji = (typeof MESSAGE_REACTION_EMOJIS)[number];

export interface IMessageReaction {
  userId: string;
  emoji: MessageReactionEmoji;
  createdAt: Date;
}

// ============================================================================
// READ RECEIPT
// ============================================================================

export interface IMessageReadReceipt {
  userId: string;
  readAt: Date;
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface IMessageProps {
  conversationId: string;
  senderId: string;
  type: EMessageType;
  content?: string;
  mediaIds?: string[];
  replyToId?: string;
  forwardedFromId?: string;
  reactions: IMessageReaction[];
  readBy: IMessageReadReceipt[];
  deliveredTo: string[];
  deletedFor: string[];
  isUnsent: boolean;
  unsentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

export interface ICreateMessageInput {
  conversationId: string;
  senderId: string;
  type: EMessageType;
  content?: string;
  mediaIds?: string[];
  replyToId?: string;
  forwardedFromId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const MESSAGE_CONSTANTS = {
  MAX_TEXT_LENGTH: 5000,
  MAX_MEDIA_PER_MESSAGE: 10,
  MAX_REACTIONS_PER_USER: 1,
  CONTENT_PREVIEW_LENGTH: 100,
} as const;
