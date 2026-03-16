import * as Response from "@/shared/responses";

import { UnfollowUserDTO } from "@/application/dtos/follow.dto";
import { ICacheService, IMessageProducer } from "@/application/services";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { ROUTING_KEYS } from "@/domain/events";
import { IUserViewerContext } from "@/application/policies/viewer-context.builder";

export class UnfollowUserUseCase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly cacheService: ICacheService,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: UnfollowUserDTO) {
    const { fromUserId, toUserId } = dto;

    if (fromUserId === toUserId) {
      throw new Response.BadRequestError("Invalid operation");
    }

    const uow = await this.uowFactory.create();

    try {
      const deleted = await uow.follows.deleteFollow(fromUserId, toUserId);
      if (!deleted) {
        return new Response.SuccessResponse({
          message: "You are not following this user",
          data: {
            viewContext: { isFollowing: false, isRequested: false } as Partial<IUserViewerContext>,
          },
        });
      }

      await uow.commit();

      // Update Redis counters atomically
      this.updateCountersAndCache(fromUserId, toUserId);

      // Publish to RabbitMQ for MongoDB sync
      try {
        await this.producer.publish(ROUTING_KEYS.COUNTER_USER_COUNTS, {
          operations: [
            { userId: toUserId, followerDelta: -1 },
            { userId: fromUserId, followingDelta: -1 },
          ],
          source: "unfollow",
          triggeredBy: fromUserId,
        });
      } catch (error) {
        console.error("[UnfollowUser] Failed to publish count update event:", error);
      }

      return new Response.SuccessResponse({
        message: "User unfollowed successfully",
        data: {
          viewContext: { isFollowing: false, isRequested: false } as Partial<IUserViewerContext>,
        },
      });
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }

  private async updateCountersAndCache(fromUserId: string, toUserId: string) {
    await Promise.all([
      // HDECRBY Redis hash counters
      // this.cacheService.hDecrBy(toStats.statsKey, toStats.statsFields.followers),
      // this.cacheService.hDecrBy(fromStats.statsKey, fromStats.statsFields.following),
    ]);
  }
}
