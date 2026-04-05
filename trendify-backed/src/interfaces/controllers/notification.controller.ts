import { Request, Response } from "express";

import {
  GetNotificationsUseCase,
  GetUnreadNotificationCountUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
} from "@/application/usecases/notification";
import { getIO } from "@/config/socket.config";

class NotificationController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly getUnreadNotificationCountUseCase: GetUnreadNotificationCountUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
  ) {}

  getNotifications = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const { isRead: isReadQuery, ...restQuery } = request.query;
    const isRead =
      isReadQuery === "true" ? true : isReadQuery === "false" ? false : undefined;

    const result = await this.getNotificationsUseCase.execute({
      userId,
      isRead,
      ...restQuery,
    });

    return response.status(200).json(result);
  };

  getUnreadCount = async (_request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const result = await this.getUnreadNotificationCountUseCase.execute({ userId });

    return response.status(200).json(result);
  };

  markAsRead = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const notificationId = request.params?.notificationId;

    const result = await this.markNotificationReadUseCase.execute({ userId, notificationId });

    this.emitReadUpdate(userId, {
      notificationId,
      unreadCount: result.data?.unreadCount || 0,
    });

    return response.status(200).json(result);
  };

  markAllAsRead = async (_request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    const result = await this.markAllNotificationsReadUseCase.execute({ userId });

    this.emitReadAllUpdate(userId);

    return response.status(200).json(result);
  };

  private emitReadUpdate(userId: string, payload: { notificationId: string; unreadCount: number }) {
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit("notification:read", {
        notificationId: payload.notificationId,
      });
      io.to(`user:${userId}`).emit("notification:unread-count", {
        unreadCount: payload.unreadCount,
      });
    } catch {
      // HTTP flow should not fail when socket layer is unavailable
    }
  }

  private emitReadAllUpdate(userId: string) {
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit("notification:read-all", {
        unreadCount: 0,
      });
      io.to(`user:${userId}`).emit("notification:unread-count", {
        unreadCount: 0,
      });
    } catch {
      // HTTP flow should not fail when socket layer is unavailable
    }
  }
}

export default NotificationController;
