import { IApiResponse } from "@/interfaces/api.interface";
import type { IPictureUrl } from "@/interfaces/user.interface";

export enum ENotificationActions {
  GET_NOTIFICATIONS = "notification/get_notifications",
  GET_UNREAD_COUNT = "notification/get_unread_count",
  MARK_AS_READ = "notification/mark_as_read",
  MARK_ALL_AS_READ = "notification/mark_all_as_read",
}

export const NOTIFICATION_ENPOINT = {
  GET_NOTIFICATIONS: "/users/me/notifications",
  GET_UNREAD_COUNT: "/users/me/notifications/unread-count",
  MARK_AS_READ: (notificationId: string) => `/users/me/notifications/${notificationId}/read`,
  MARK_ALL_AS_READ: "/users/me/notifications/read-all",
};

export interface INotificationActor {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: IPictureUrl | null;
  isVerified: boolean;
}

export interface INotificationItem {
  id: string;
  type: "post_like" | "post_comment" | "post_mention" | "follow";
  actor: INotificationActor;
  targetId: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface IGetNotificationsParams {
  since?: string;
  cursor?: string;
  limit?: number;
}

export interface INotificationListResponse extends IApiResponse {
  data: {
    items: INotificationItem[];
    cursor: string | null;
    hasNext: boolean;
    unreadCount: number;
  };
}

export interface IUnreadCountResponse extends IApiResponse {
  data: {
    unreadCount: number;
  };
}

export interface IMarkAsReadResponse extends IApiResponse {
  data: {
    notificationId?: string;
    unreadCount: number;
  };
}

export interface INotificationState {
  items: INotificationItem[];
  unreadCount: number;
  cursor: string | null;
  hasNext: boolean;
}
