import { GetUnreadNotificationCountDTO } from "@/application/dtos/notification.dto";
import { SuccessResponse } from "@/shared/responses";
import { INotificationRepository } from "@/domain/notification";

export class GetUnreadNotificationCountUseCase {
  constructor(private readonly notificationRepo: INotificationRepository) {}

  async execute(dto: GetUnreadNotificationCountDTO) {
    const unreadCount = await this.notificationRepo.countUnread(dto.userId);

    return new SuccessResponse({
      data: {
        unreadCount,
      },
    });
  }
}
