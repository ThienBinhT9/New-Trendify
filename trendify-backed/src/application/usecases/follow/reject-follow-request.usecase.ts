import * as Response from "@/shared/responses";

import { RejectFollowRequestDTO } from "@/application/dtos/follow.dto";
import { IFollowRepository } from "@/domain/follow";
import { IUserViewerContext } from "@/application/policies/viewer-context.builder";

export class RejectFollowRequestUseCase {
  constructor(private readonly followRepo: IFollowRepository) {}

  async execute(dto: RejectFollowRequestDTO) {
    const { fromUserId, toUserId } = dto;

    if (fromUserId === toUserId) {
      throw new Response.BadRequestError("Invalid operation");
    }

    const deleted = await this.followRepo.deleteRequest(fromUserId, toUserId);
    if (!deleted) {
      return new Response.SuccessResponse({
        message: "There is no follow request to decline",
        data: {
          viewContext: {
            isFollowedBy: false,
            isRequestedByThem: false,
          } as Partial<IUserViewerContext>,
        },
      });
    }

    return new Response.SuccessResponse({
      message: "Follow request rejected",
      data: {
        viewContext: {
          isFollowedBy: false,
          isRequestedByThem: false,
        } as Partial<IUserViewerContext>,
      },
    });
  }
}
