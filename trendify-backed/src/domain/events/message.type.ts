import { EMediaPurpose } from "@/domain/media";

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

// Union type của tất cả messages
export type AppMessage =
  | PasswordResetEmailMessage
  | UserCountsUpdateMessage
  | MediaProcessMessage
  | PostLikeMessage
  | PostCommentMessage
  | PostSaveMessage;

// Mapping từ routing key -> message type
export const ROUTING_KEYS = {
  EMAIL_PASSWORD_RESET: "email.password-reset",
  COUNTER_USER_COUNTS: "counter.user-counts",
  PROCESS_MEDIA: "media.process",
  COUNTER_POST_LIKE: "counter.post-like",
  COUNTER_POST_COMMENT: "counter.post-comment",
  COUNTER_POST_SAVE: "counter.post-save",
} as const;

// Extract routing key từ message type
export function getRoutingKey(messageType: AppMessage["type"]): string {
  return messageType;
}
