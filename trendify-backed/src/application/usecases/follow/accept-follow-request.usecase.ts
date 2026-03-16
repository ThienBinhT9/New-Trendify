import * as Response from "@/shared/responses";

import { AcceptFollowRequestDTO } from "@/application/dtos/follow.dto";
import { EFollowStatus } from "@/domain/follow";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { ICacheService, IMessageProducer } from "@/application/services";
import { ROUTING_KEYS } from "@/domain/events";
import { IUserViewerContext } from "@/application/policies/viewer-context.builder";

export class AcceptFollowRequestUseCase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly cacheService: ICacheService,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: AcceptFollowRequestDTO) {
    const { fromUserId, toUserId } = dto;

    if (fromUserId === toUserId) {
      throw new Response.BadRequestError("Invalid operation");
    }

    const uow = await this.uowFactory.create();
    try {
      const requesterUser = await uow.users.findById(fromUserId);
      if (!requesterUser) {
        await uow.follows.deleteRequest(fromUserId, toUserId);
        await uow.commit();
        throw new Response.NotFoundError("User who sent the request no longer exists");
      }

      const isBlocked = await uow.blocks.isEitherBlocked(fromUserId, toUserId);
      if (isBlocked) {
        await uow.follows.deleteRequest(fromUserId, toUserId);
        await uow.commit();
        throw new Response.ForbiddenError("Cannot accept request from blocked user");
      }

      const followRequest = await uow.follows.findByPair(
        fromUserId,
        toUserId,
        EFollowStatus.PENDING,
      );
      if (!followRequest) {
        throw new Response.NotFoundError("Follow request not found or already handled");
      }

      followRequest.accept();
      await uow.follows.save(followRequest);
      await uow.commit();

      // Update Redis counters atomically
      this.updateCountersAndCache(fromUserId, toUserId);

      // Publish to RabbitMQ for MongoDB sync
      try {
        await this.producer.publish(ROUTING_KEYS.COUNTER_USER_COUNTS, {
          operations: [
            { userId: toUserId, followerDelta: 1 },
            { userId: fromUserId, followingDelta: 1 },
          ],
          source: "accept-follow",
          triggeredBy: toUserId,
        });
      } catch (error) {
        console.error("[AcceptFollowRequest] Failed to publish count update event:", error);
      }

      return new Response.SuccessResponse({
        message: "Follow request accepted",
        data: {
          viewContext: {
            isFollowedBy: true,
            isRequestedByThem: false,
          } as Partial<IUserViewerContext>,
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
