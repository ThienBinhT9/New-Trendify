export interface GetNotificationsDTO {
  userId: string;
  cursor?: string;
  limit?: number;
  since?: string;
  isRead?: boolean;
}

export interface MarkNotificationReadDTO {
  userId: string;
  notificationId: string;
}

export interface MarkAllNotificationsReadDTO {
  userId: string;
}

export interface GetUnreadNotificationCountDTO {
  userId: string;
}
