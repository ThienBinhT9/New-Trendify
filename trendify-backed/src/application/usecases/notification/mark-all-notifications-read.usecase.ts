import { MarkAllNotificationsReadDTO } from "@/application/dtos/notification.dto";
import { SuccessResponse } from "@/shared/responses";
import { INotificationRepository } from "@/domain/notification";

export class MarkAllNotificationsReadUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(dto: MarkAllNotificationsReadDTO) {
    const { userId } = dto;

    const updatedCount = await this.notificationRepo.markAllAsRead(userId);

    return new SuccessResponse({
      data: {
        updatedCount,
        unreadCount: 0,
      },
    });
  }
}
