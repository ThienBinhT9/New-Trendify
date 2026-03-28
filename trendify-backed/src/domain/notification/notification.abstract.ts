import { NotificationEntity } from "./notification.entity";

export interface INotificationRepository {
  /**
   * Create or update (upsert) a notification.
   * Uses compound unique index to prevent duplicates.
   * Returns the notification entity (created or updated).
   */
  upsert(notification: NotificationEntity): Promise<NotificationEntity>;

  /**
   * Find notifications by recipient with cursor pagination.
   */
  findByRecipient(
    recipientId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ notifications: NotificationEntity[]; nextCursor?: string }>;

  /**
   * Find notifications newer than a timestamp.
   * Used for offline catch-up after reconnect.
   */
  findByRecipientSince(
    recipientId: string,
    since: Date,
    limit: number,
  ): Promise<NotificationEntity[]>;

  /**
   * Mark a single notification as read.
   * Returns true if updated, false if not found.
   */
  markAsRead(notificationId: string, recipientId: string): Promise<boolean>;

  /**
   * Mark all notifications as read for a user.
   * Returns count of updated notifications.
   */
  markAllAsRead(recipientId: string): Promise<number>;

  /**
   * Count unread notifications for a user.
   */
  countUnread(recipientId: string): Promise<number>;
}
