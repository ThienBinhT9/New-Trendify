import { IApiResponse } from "@/interfaces/api.interface";
import type { IPictureUrl } from "@/interfaces/user.interface";

// ============================================================================
// ENUMS
// ============================================================================

export enum EChatActions {
  GET_CONVERSATIONS = "chat/get_conversations",
  GET_MESSAGES = "chat/get_messages",
  SEND_MESSAGE = "chat/send_message",
  SEARCH_MESSAGES = "chat/search_messages",
}

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

// ============================================================================
// ENDPOINTS
// ============================================================================

export const CHAT_ENDPOINT = {
  CONVERSATIONS: "/chat/conversations",
  CONVERSATION_DETAIL: (id: string) => `/chat/conversations/${id}`,
  MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
  SEND_MESSAGE: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
  SEARCH_MESSAGES: (conversationId: string) =>
    `/chat/conversations/${conversationId}/messages/search`,
  MARK_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
  DELETE_CONVERSATION: (conversationId: string) => `/chat/conversations/${conversationId}`,
  PIN_CONVERSATION: (conversationId: string) => `/chat/conversations/${conversationId}/pin`,
  CREATE_DM: "/chat/conversations",
  // Group management
  CREATE_GROUP: "/chat/conversations/group",
  UPDATE_GROUP: (id: string) => `/chat/conversations/${id}`,
  ADD_MEMBER: (conversationId: string) => `/chat/conversations/${conversationId}/members`,
  REMOVE_MEMBER: (conversationId: string, userId: string) =>
    `/chat/conversations/${conversationId}/members/${userId}`,
  LEAVE_GROUP: (conversationId: string) => `/chat/conversations/${conversationId}/leave`,
  GET_MEMBERS: (conversationId: string) => `/chat/conversations/${conversationId}/members`,
  PROMOTE_MEMBER: (conversationId: string, userId: string) => `/chat/conversations/${conversationId}/members/${userId}/promote`,
  DEMOTE_MEMBER: (conversationId: string, userId: string) => `/chat/conversations/${conversationId}/members/${userId}/demote`,
  // Settings
  UPDATE_SETTINGS: (conversationId: string) => `/chat/conversations/${conversationId}/settings`,
  // Media
  CONVERSATION_MEDIA: (conversationId: string) => `/chat/conversations/${conversationId}/media`,
};

// ============================================================================
// INTERFACES
// ============================================================================

export interface IChatUser {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: IPictureUrl | null;
  isVerified: boolean;
}

export interface ILastMessage {
  messageId: string;
  senderId: string;
  content: string;
  type: EMessageType;
  createdAt: string;
}

export interface IConversationMember {
  userId: string;
  role: "member" | "admin" | "owner";
  lastReadMessageId?: string;
  lastReadAt?: string;
  isArchived: boolean;
  isPinned: boolean;
}

export interface IConversationSettings {
  themeId?: string;
  quickEmoji?: string;
  nicknames?: Record<string, string>;
}

export interface IConversation {
  id: string;
  type: "direct" | "group";
  name?: string;
  avatarMediaId?: string;
  avatarUrl?: string;
  members: IConversationMember[];
  lastMessage?: ILastMessage;
  pinnedMessageIds: string[];
  settings?: IConversationSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Enriched by mapper
  otherUser?: IChatUser;
  unreadCount?: number;
}

export interface IMessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface IMessageReadReceipt {
  userId: string;
  readAt: string;
}

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  type: EMessageType;
  content?: string;
  mediaIds?: string[];
  mediaUrls?: string[];
  replyToId?: string;
  replyTo?: IMessage;
  forwardedFromId?: string;
  reactions: IMessageReaction[];
  readBy: IMessageReadReceipt[];
  isUnsent: boolean;
  createdAt: string;
  updatedAt: string;
  // Enriched
  sender?: IChatUser;
  isMine?: boolean;
  // Optimistic UI
  status?: "sending" | "sent" | "failed";
  _optimisticId?: string;
  localMediaUrls?: string[];
}

// ============================================================================
// REQUEST PARAMS
// ============================================================================

export interface IGetConversationsParams {
  cursor?: string;
  limit?: number;
  filter?: "all" | "unread" | "archived";
}

export interface IGetMessagesParams {
  cursor?: string;
  limit?: number;
}

export interface ISendMessageParams {
  conversationId: string;
  type: EMessageType;
  content?: string;
  mediaIds?: string[];
  replyToId?: string;
}

export interface ICreateGroupParams {
  name: string;
  memberIds: string[];
  avatarMediaId?: string;
}

export interface IAddMemberParams {
  conversationId: string;
  userId: string;
}

export interface IUpdateGroupParams {
  conversationId: string;
  name?: string;
  avatarMediaId?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface IConversationListResponse extends IApiResponse {
  data: {
    items: IConversation[];
    cursor: string | null;
    hasNext: boolean;
  };
}

export interface IMessageListResponse extends IApiResponse {
  data: {
    items: IMessage[];
    cursor: string | null;
    hasNext: boolean;
  };
}

export interface ISendMessageResponse extends IApiResponse {
  data: IMessage;
}

export interface ICreateDMResponse extends IApiResponse {
  data: IConversation;
}

export interface ICreateGroupResponse extends IApiResponse {
  data: IConversation;
}

// ============================================================================
// STATE
// ============================================================================

export interface IMessagesData {
  items: IMessage[];
  cursor: string | null;
  hasNext: boolean;
  loading: boolean;
}

export interface IChatState {
  conversations: {
    items: IConversation[];
    cursor: string | null;
    hasNext: boolean;
    loading: boolean;
  };
  activeConversationId: string | null;
  messages: Record<string, IMessagesData>;
  typingUsers: Record<string, string[]>;
  unreadTotalCount: number;
}
