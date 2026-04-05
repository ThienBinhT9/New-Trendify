import { ENotificationType } from "./notification.type";
import { NotificationEntity } from "./notification.entity";

export interface INotificationRepository {
  /**
   * Create or update (upsert) a NON-AGGREGATED notification.
   * Uses compound unique index { recipientId, type, actorId, targetId }.
   */
  upsert(notification: NotificationEntity): Promise<NotificationEntity>;

  /**
   * Atomic upsert for AGGREGATED notification (POST_LIKE).
   * Creates or updates a single notification per (recipient + type + target).
   * Pushes the new actor to front of latestActors (max 2), increments count.
   */
  upsertAggregated(input: {
    recipientId: string;
    type: ENotificationType;
    targetId: string;
    actorId: string;
  }): Promise<NotificationEntity>;

  /**
   * Remove an actor from an aggregated notification (unlike).
   * Decrements totalActorCount, removes from latestActors.
   * Deletes the notification if count reaches 0.
   * Fills latestActors with replacements if needed.
   */
  removeActorFromAggregated(input: {
    recipientId: string;
    type: ENotificationType;
    targetId: string;
    actorId: string;
    replacementActorIds?: string[];
  }): Promise<void>;

  findByRecipient(
    recipientId: string,
    limit: number,
    cursor?: string,
    isRead?: boolean,
  ): Promise<{ notifications: NotificationEntity[]; nextCursor?: string }>;

  /**
   * Find notifications newer than a timestamp.
   * Used for offline catch-up after reconnect.
   */
  findByRecipientSince(
    recipientId: string,
    since: Date,
    limit: number,
    isRead?: boolean,
  ): Promise<NotificationEntity[]>;

  /**
   * Mark a single notification as read.
   */
  markAsRead(notificationId: string, recipientId: string): Promise<boolean>;

  /**
   * Mark all notifications as read for a user.
   */
  markAllAsRead(recipientId: string): Promise<number>;

  /**
   * Count unread notifications for a user.
   */
  countUnread(recipientId: string): Promise<number>;

  /**
   * Delete a follow or follow_request notification.
   */
  deleteFollowNotification(
    actorId: string,
    recipientId: string,
    type: "follow" | "follow_request",
  ): Promise<boolean>;
}
