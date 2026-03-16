import * as Response from "@/shared/responses";

import { RemovefollowUserDTO } from "@/application/dtos/follow.dto";
import { ICacheService, IMessageProducer } from "@/application/services";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { ROUTING_KEYS } from "@/domain/events";

export class RemovefollowUserUseCase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly cacheService: ICacheService,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: RemovefollowUserDTO) {
    const { fromUserId, toUserId } = dto;

    if (fromUserId === toUserId) {
      throw new Response.BadRequestError("Invalid operation");
    }

    console.log({ fromUserId, toUserId });

    const uow = await this.uowFactory.create();

    try {
      const deleted = await uow.follows.deleteFollow(toUserId, fromUserId);
      if (!deleted) {
        return new Response.SuccessResponse({ message: "You are not following this user" });
      }

      await uow.commit();

      // Update Redis counters atomically
      this.updateCountersAndCache(fromUserId, toUserId);

      // Publish to RabbitMQ for MongoDB sync
      try {
        await this.producer.publish(ROUTING_KEYS.COUNTER_USER_COUNTS, {
          operations: [
            { userId: fromUserId, followerDelta: -1 },
            { userId: toUserId, followingDelta: -1 },
          ],
          source: "removefollow",
          triggeredBy: toUserId,
        });
      } catch (error) {
        console.error("[RemovefollowUser] Failed to publish count update event:", error);
      }

      return new Response.SuccessResponse({
        message: "User removed from following list successfully",
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
