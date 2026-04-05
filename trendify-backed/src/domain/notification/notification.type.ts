export enum ENotificationType {
  POST_LIKE = "post_like",
  POST_COMMENT = "post_comment",
  POST_MENTION = "post_mention",
  FOLLOW = "follow",
  FOLLOW_REQUEST = "follow_request",
}

/**
 * Types that aggregate multiple actors into a single notification.
 * e.g. "X, Y và 198 người khác đã thích bài viết của bạn."
 */
export const AGGREGATED_NOTIFICATION_TYPES: ENotificationType[] = [ENotificationType.POST_LIKE];

export interface INotificationProps {
  // Who receives this notification
  recipientId: string;

  // Type of notification
  type: ENotificationType;

  // Reference to the target (postId for likes/comments, actorId for follows)
  targetId: string;

  // Optional reference to related entity (e.g., commentId for POST_COMMENT)
  referenceId?: string;

  // Read status
  isRead: boolean;

  // === Non-aggregated (follow, mention, comment) ===
  actorId?: string;

  // === Aggregated (post_like) ===
  latestActors: string[]; // max 2, newest first
  totalActorCount: number; // total unique actors

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

/**
 * Input for creating a NON-aggregated notification (follow, comment, mention).
 * Aggregated notifications use repository.upsertAggregated() directly.
 */
export interface INotificationCreateInput {
  recipientId: string;
  actorId: string;
  type: ENotificationType;
  targetId: string;
  referenceId?: string;
}
