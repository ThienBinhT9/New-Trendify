export enum ENotificationType {
  POST_LIKE = "post_like",
  POST_COMMENT = "post_comment",
  POST_MENTION = "post_mention",
}

export interface INotificationProps {
  // Who receives this notification
  recipientId: string;

  // Who caused this notification
  actorId: string;

  // Type of notification
  type: ENotificationType;

  // Reference to the target (postId, commentId, etc.)
  targetId: string;

  // Optional reference to related entity (e.g., commentId for POST_COMMENT)
  referenceId?: string;

  // Read status
  isRead: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

export interface INotificationCreateInput {
  recipientId: string;
  actorId: string;
  type: ENotificationType;
  targetId: string;
  referenceId?: string;
}
