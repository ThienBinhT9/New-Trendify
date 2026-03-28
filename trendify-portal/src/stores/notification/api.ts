import apiClient from "@/services/api-clients";

import {
  IGetNotificationsParams,
  IMarkAsReadResponse,
  INotificationListResponse,
  IUnreadCountResponse,
  NOTIFICATION_ENPOINT,
} from "./constants";

export const getNotifications = async (params?: IGetNotificationsParams) => {
  return apiClient.get<INotificationListResponse>(NOTIFICATION_ENPOINT.GET_NOTIFICATIONS, {
    params,
  });
};

export const getUnreadCount = async () => {
  return apiClient.get<IUnreadCountResponse>(NOTIFICATION_ENPOINT.GET_UNREAD_COUNT);
};

export const markAsRead = async (notificationId: string) => {
  return apiClient.patch<IMarkAsReadResponse>(NOTIFICATION_ENPOINT.MARK_AS_READ(notificationId));
};

export const markAllAsRead = async () => {
  return apiClient.patch<IMarkAsReadResponse>(NOTIFICATION_ENPOINT.MARK_ALL_AS_READ);
};
