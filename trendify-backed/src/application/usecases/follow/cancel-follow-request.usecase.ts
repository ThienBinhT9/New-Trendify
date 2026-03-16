import * as Response from "@/shared/responses";

import { CancelFollowRequestDTO } from "@/application/dtos/follow.dto";
import { IFollowRepository } from "@/domain/follow";
import { IUserViewerContext } from "@/application/policies/viewer-context.builder";

export class CancelFollowRequestUseCase {
  constructor(private readonly followRepo: IFollowRepository) {}

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

    return new Response.SuccessResponse({
      message: "Follow request cancelled",
      data: { viewContext: response },
    });
  }
}
