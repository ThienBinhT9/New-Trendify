import * as Response from "@/shared/responses";

import { FollowUserDTO } from "@/application/dtos/follow.dto";
import { ICacheService, IMessageProducer } from "@/application/services";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { FollowEntity } from "@/domain/follow";
import { ROUTING_KEYS } from "@/domain/events";
import {
  IUserViewerContext,
  ViewerContextBuilder,
} from "@/application/policies/viewer-context.builder";

export class FollowUserUseCase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly cacheService: ICacheService,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: FollowUserDTO) {
    const { fromUserId, toUserId } = dto;

    if (fromUserId === toUserId) {
      throw new Response.BadRequestError("Cannot follow yourself");
    }

    const uow = await this.uowFactory.create();
    try {
      const targetUser = await uow.users.findById(toUserId);
      if (!targetUser) {
        throw new Response.NotFoundError("User not found");
      }

      const isBlocked = await uow.blocks.isEitherBlocked(fromUserId, toUserId);
      if (isBlocked) {
        throw new Response.ForbiddenError("Unable to follow this user");
      }

      // Step 3: Determine follow type based on target's privacy settings
      const targetSettings = await uow.userSettings.findByUserId(toUserId);
      if (targetSettings?.isProfilePrivate()) {
        const followRequest = FollowEntity.createRequest(fromUserId, toUserId);

        await uow.follows.create(followRequest);
        await uow.commit();

        // TODO: Send notification to target user

        return new Response.SuccessResponse({
          message: "Follow request sent",
          data: {
            viewContext: { isRequested: true, isFollowing: false } as Partial<IUserViewerContext>,
          },
        });
      }

      const follow = FollowEntity.create(fromUserId, toUserId);
      const followResult = await uow.follows.create(follow);
      if (!followResult) {
        return new Response.SuccessResponse({
          message: "Already following this user",
          data: {
            viewContext: { isRequested: false, isFollowing: true } as Partial<IUserViewerContext>,
          },
        });
      }

      await uow.commit();

      // Update Redis counters atomically (real-time stats)
      this.updateCountersAndCache(fromUserId, toUserId);

      // Also publish to RabbitMQ for MongoDB sync
      try {
        await this.producer.publish(ROUTING_KEYS.COUNTER_USER_COUNTS, {
          operations: [
            { userId: toUserId, followerDelta: 1 },
            { userId: fromUserId, followingDelta: 1 },
          ],
          source: "follow",
          triggeredBy: fromUserId,
        });
      } catch (error) {
        console.error("[FollowUser] Failed to publish count update event:", error);
      }

      return new Response.SuccessResponse({
        message: "User followed successfully",
        data: {
          viewContext: { isRequested: false, isFollowing: true } as Partial<IUserViewerContext>,
        },
      });
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }

  private async updateCountersAndCache(fromUserId: string, toUserId: string) {
    await Promise.all([
      // HINCRBY Redis hash counters
      // this.cacheService.hIncrBy(toStats.statsKey, toStats.statsFields.followers),
      // this.cacheService.hIncrBy(fromStats.statsKey, fromStats.statsFields.following),
    ]);
  }
}
