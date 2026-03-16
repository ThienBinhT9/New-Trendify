import * as Response from "@/shared/responses";

import { UnblockUserDTO } from "@/application/dtos/block.dto";
import { ICacheService } from "@/application/services";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";

export class UnblockUserUsecase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly cacheSvc: ICacheService,
  ) {}

  async execute(dto: UnblockUserDTO) {
    const { blockerId, blockedId } = dto;

    if (blockerId === blockedId) {
      throw new Response.BadRequestError("Invalid operation");
    }

    const uow = await this.uowFactory.create();

    try {
      const deleted = await uow.blocks.delete(blockerId, blockedId);
      if (!deleted) {
        return new Response.SuccessResponse({ message: "User is not blocked" });
      }

      await uow.commit();

      await Promise.all([
        this.cacheSvc.del(CacheContextBuilder.userProfile(blockerId).baseKey),
        this.cacheSvc.del(CacheContextBuilder.userProfile(blockedId).baseKey),
      ]);

      return new Response.SuccessResponse({ message: "User unblocked successfully" });
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }
}
