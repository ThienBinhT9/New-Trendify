import * as Response from "@/shared/responses";
import { IBlockRepository } from "@/domain/block";

export class CheckBlockStatusUsecase {
  constructor(private readonly blockRepo: IBlockRepository) {}

  async execute(dto: { viewerId: string; targetId: string }) {
    const { viewerId, targetId } = dto;

    if (viewerId === targetId) {
      return new Response.SuccessResponse({
        data: { isBlockedByMe: false, isBlockedByThem: false },
      });
    }

    const [isBlockedByMe, isBlockedByThem] = await Promise.all([
      this.blockRepo.isBlocked(viewerId, targetId),
      this.blockRepo.isBlocked(targetId, viewerId),
    ]);

    return new Response.SuccessResponse({
      data: { isBlockedByMe, isBlockedByThem },
    });
  }
}
