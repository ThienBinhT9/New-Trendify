import * as Response from "@/shared/responses";

import { CancelFollowRequestDTO } from "@/application/dtos/follow.dto";
import { IFollowRepository } from "@/domain/follow";
import { IUserViewerContext } from "@/application/policies/viewer-context.builder";
import { INotificationRepository } from "@/domain/notification";

export class CancelFollowRequestUseCase {
  constructor(
    private readonly followRepo: IFollowRepository,
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(dto: CancelFollowRequestDTO) {
    const { fromUserId, toUserId } = dto;

    if (fromUserId === toUserId) {
      throw new Response.BadRequestError("Invalid operation");
    }

    const response = { isRequested: false, isFollowing: false } as Partial<IUserViewerContext>;

    const deleted = await this.followRepo.deleteRequest(fromUserId, toUserId);
    if (!deleted) {
      return new Response.SuccessResponse({
        message: "There is no follow request to cancel",
        data: { viewContext: response },
      });
    }

    // Xóa follow_request notification: fire-and-forget
    this.notificationRepo
      .deleteFollowNotification(fromUserId, toUserId, "follow_request")
      .catch((error) =>
        console.error("[CancelFollowRequest] Failed to delete follow_request notification:", error),
      );

    return new Response.SuccessResponse({
      message: "Follow request cancelled",
      data: { viewContext: response },
    });
  }
}
