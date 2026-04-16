import { EMediaPurpose } from "@/domain/media";
import { EMessageType } from "@/domain/chat";

export interface BaseMessage {
  id: string;
  type: string;
  timestamp: number;
}

// Email messages
export interface PasswordResetEmailMessage extends BaseMessage {
  type: "email.password-reset";
  data: {
    userId: string;
    email: string;
    resetToken: string;
  };
}

// User count update operation
export interface UserCountOperation {
  userId: string;
  followerDelta?: number;
  followingDelta?: number;
}

// User counts update message (async count updates)
export interface UserCountsUpdateMessage extends BaseMessage {
  type: "counter.user-counts";
  data: {
    operations: UserCountOperation[];
    source: "block" | "unblock" | "follow" | "unfollow" | "accept-follow";
    triggeredBy: string; // userId who triggered the action
  };
}

// Media processing message
export interface MediaProcessMessage extends BaseMessage {
  type: "media.process";
  data: {
    mediaId: string;
    key: string;
    purpose: EMediaPurpose;
    mimeType: string;
    bucket: string;
  };
}

// Post like message (async counter update + notification)
export interface PostLikeMessage extends BaseMessage {
  type: "counter.post-like";
  data: {
    postId: string;
    postAuthorId: string;
    likerId: string;
    delta: number; // +1 for like, -1 for unlike
  };
}

// Post comment message (async counter update + notification)
export interface PostCommentMessage extends BaseMessage {
  type: "counter.post-comment";
  data: {
    postId: string;
    postAuthorId: string;
    commentId: string;
    commenterId: string;
    parentId?: string;
    mentions?: { userId: string }[];
    delta: number; // +1 for create, -1 for delete
  };
}

// Post save message (async counter update)
export interface PostSaveMessage extends BaseMessage {
  type: "counter.post-save";
  data: {
    postId: string;
    userId: string;
    delta: number; // +1 for save, -1 for unsave
  };
}

// Follow notification message (async notification)
export interface FollowNotificationMessage extends BaseMessage {
  type: "counter.follow-notification";
  data: {
    actorId: string; // user who performed follow action
    recipientId: string; // user who receives notification
    notificationType: "follow" | "follow_request";
  };
}

// ============================================================================
// CHAT MESSAGES
// ============================================================================

/**
 * Chat message sent — triggers push notification for offline users
 * and updates unread badge for recipients.
 */
export interface ChatMessageSentMessage extends BaseMessage {
  type: "chat.message-sent";
  data: {
    conversationId: string;
    messageId: string;
    senderId: string;
    recipientIds: string[];
    messageType: EMessageType;
    preview: string;
  };
}

/**
 * Chat media processing — thumbnail generation, compression, etc.
 */
export interface ChatMediaProcessMessage extends BaseMessage {
  type: "chat.media-process";
  data: {
    mediaId: string;
    messageId: string;
    conversationId: string;
    key: string;
    mimeType: string;
    bucket: string;
  };
}

// Union type của tất cả messages
export type AppMessage =
  | PasswordResetEmailMessage
  | UserCountsUpdateMessage
  | MediaProcessMessage
  | PostLikeMessage
  | PostCommentMessage
  | PostSaveMessage
  | FollowNotificationMessage
  | ChatMessageSentMessage
  | ChatMediaProcessMessage;

// Mapping từ routing key -> message type
export const ROUTING_KEYS = {
  EMAIL_PASSWORD_RESET: "email.password-reset",
  COUNTER_USER_COUNTS: "counter.user-counts",
  PROCESS_MEDIA: "media.process",
  COUNTER_POST_LIKE: "counter.post-like",
  COUNTER_POST_COMMENT: "counter.post-comment",
  COUNTER_POST_SAVE: "counter.post-save",
  COUNTER_FOLLOW_NOTIFICATION: "counter.follow-notification",
  CHAT_MESSAGE_SENT: "chat.message-sent",
  CHAT_MEDIA_PROCESS: "chat.media-process",
} as const;

// Extract routing key từ message type
export function getRoutingKey(messageType: AppMessage["type"]): string {
  return messageType;
}
