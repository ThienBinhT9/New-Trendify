import * as Response from "@/shared/responses";

import { MarkNotificationReadDTO } from "@/application/dtos/notification.dto";
import { INotificationRepository } from "@/domain/notification";

export class MarkNotificationReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(dto: MarkNotificationReadDTO) {
    const { userId, notificationId } = dto;

    const updated = await this.notificationRepo.markAsRead(notificationId, userId);

    if (!updated) {
      throw new Response.NotFoundError("Notification not found");
    }

    const unreadCount = await this.notificationRepo.countUnread(userId);

    return new Response.SuccessResponse({
      data: {
        notificationId,
        unreadCount,
      },
    });
  }
}
