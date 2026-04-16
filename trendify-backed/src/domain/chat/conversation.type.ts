// ============================================================================
// ENUMS
// ============================================================================

export enum EConversationType {
  DIRECT = "direct",
  GROUP = "group",
}

export enum EConversationRole {
  MEMBER = "member",
  OWNER = "owner",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface ILastMessageSnapshot {
  messageId: string;
  senderId: string;
  content: string;
  type: string;
  createdAt: Date;
}

export interface IConversationSettings {
  themeId?: string;
  quickEmoji?: string;
  nicknames?: Record<string, string>; // { [userId]: "nickname" }
}

export interface IConversationMember {
  userId: string;
  role: EConversationRole;
  joinedAt: Date;
  lastReadMessageId?: string;
  lastReadAt?: Date;
  mutedUntil?: Date | null;
  isArchived: boolean;
  isPinned: boolean;
}

export interface IConversationProps {
  type: EConversationType;
  members: IConversationMember[];
  name?: string;
  avatarMediaId?: string;
  createdBy: string;
  lastMessage?: ILastMessageSnapshot;
  pinnedMessageIds: string[];
  settings?: IConversationSettings;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

export interface ICreateDirectConversationInput {
  creatorId: string;
  participantId: string;
}

export interface ICreateGroupConversationInput {
  creatorId: string;
  name: string;
  memberIds: string[];
  avatarMediaId?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CONVERSATION_CONSTANTS = {
  MAX_GROUP_MEMBERS: 250,
  MAX_PINNED_MESSAGES: 50,
  MAX_GROUP_NAME_LENGTH: 100,
  DIRECT_MEMBER_COUNT: 2,
} as const;
