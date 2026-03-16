import * as Response from "@/shared/responses";

import { BlockUserDTO } from "@/application/dtos/block.dto";
import { ICacheService, IMessageProducer } from "@/application/services";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { BlockEntity } from "@/domain/block";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";
import { EFollowStatus } from "@/domain/follow";
import { ROUTING_KEYS, UserCountOperation } from "@/domain/events";

export class BlockUserUsecase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly cacheSvc: ICacheService,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: BlockUserDTO) {
    const { blockerId, blockedId, reason } = dto;

    if (blockerId === blockedId) {
      throw new Response.BadRequestError("You cannot block yourself");
    }

    const uow = await this.uowFactory.create();

    const countOperations: UserCountOperation[] = [];

    try {
      const targetUser = await uow.users.findById(blockedId);
      if (!targetUser) {
        throw new Response.NotFoundError("User not found");
      }

      const block = BlockEntity.create({ blockerId, blockedId, reason });

      const created = await uow.blocks.create(block);
      if (!created) {
        return new Response.SuccessResponse({ message: "User is already blocked" });
      }

      const [followA, followB] = await Promise.all([
        uow.follows.findByPair(blockerId, blockedId, EFollowStatus.ACCEPTED),
        uow.follows.findByPair(blockedId, blockerId, EFollowStatus.ACCEPTED),
      ]);

      await uow.follows.deleteByPairs([
        { followerId: blockerId, followingId: blockedId },
        { followerId: blockedId, followingId: blockerId },
      ]);

      if (followA) {
        countOperations.push(
          { userId: blockerId, followingDelta: -1 },
          { userId: blockedId, followerDelta: -1 },
        );
      }

      if (followB) {
        countOperations.push(
          { userId: blockedId, followingDelta: -1 },
          { userId: blockerId, followerDelta: -1 },
        );
      }

      await uow.commit();

      // Invalidate profile caches + update Redis counters
      this.invalidateCacheAndCounters(blockerId, blockedId, countOperations);

      if (countOperations.length > 0) {
        try {
          await this.producer.publish(ROUTING_KEYS.COUNTER_USER_COUNTS, {
            operations: countOperations,
            source: "block",
            triggeredBy: blockerId,
          });
        } catch (error) {
          console.error("[BlockUser] Failed to publish count update event:", error);
          // Don't throw - block action already committed, counts will sync via reconciliation
        }
      }

      return new Response.SuccessResponse({ message: "User blocked successfully" });
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }

  private async invalidateCacheAndCounters(
    blockerId: string,
    blockedId: string,
    countOperations: UserCountOperation[],
  ) {
    const promises: Promise<any>[] = [
      // Invalidate follow list caches
      this.cacheSvc.delByPrefix(CacheContextBuilder.follow(blockerId).followerPrefix),
      this.cacheSvc.delByPrefix(CacheContextBuilder.follow(blockedId).followerPrefix),
      this.cacheSvc.delByPrefix(CacheContextBuilder.follow(blockerId).followingPrefix),
      this.cacheSvc.delByPrefix(CacheContextBuilder.follow(blockedId).followingPrefix),
    ];

    // Update Redis hash counters for removed follows
    for (const op of countOperations) {
      const stats = CacheContextBuilder.userProfile(op.userId);
      if (op.followerDelta) {
        promises.push(
          this.cacheSvc.hDecrBy(
            stats.statsKey,
            stats.statsFields.followers,
            Math.abs(op.followerDelta),
          ),
        );
      }
      if (op.followingDelta) {
        promises.push(
          this.cacheSvc.hDecrBy(
            stats.statsKey,
            stats.statsFields.following,
            Math.abs(op.followingDelta),
          ),
        );
      }
    }

    await Promise.all(promises);
  }
}
