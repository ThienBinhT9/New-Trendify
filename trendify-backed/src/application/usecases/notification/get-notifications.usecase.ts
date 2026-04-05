import * as Response from "@/shared/responses";

import { GetNotificationsDTO } from "@/application/dtos/notification.dto";
import { toMediaRecord } from "@/application/mappers/media.mapper";
import { UserMapper, AuthorDTO } from "@/application/mappers";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { IMediaRepository } from "@/domain/media";
import { INotificationRepository, NotificationEntity } from "@/domain/notification";
import { IUserRepository } from "@/domain/user";

export class GetNotificationsUseCase {
  constructor(
    private readonly notificationRepo: INotificationRepository,
    private readonly userRepo: IUserRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetNotificationsDTO) {
    const { userId, cursor, since, limit = 20, isRead } = dto;

    const safeLimit = Math.max(1, Math.min(limit, 50));

    if (since) {
      const parsedSince = new Date(since);
      if (Number.isNaN(parsedSince.getTime())) {
        throw new Response.BadRequestError("Invalid since timestamp");
      }

      const [notifications, unreadCount] = await Promise.all([
        this.notificationRepo.findByRecipientSince(userId, parsedSince, safeLimit, isRead),
        this.notificationRepo.countUnread(userId),
      ]);

      const items = await this.mapNotifications(notifications);

      return new Response.SuccessResponse({
        data: {
          items,
          cursor: null,
          hasNext: false,
          unreadCount,
        },
      });
    }

    const [result, unreadCount] = await Promise.all([
      this.notificationRepo.findByRecipient(userId, safeLimit, cursor, isRead),
      this.notificationRepo.countUnread(userId),
    ]);

    const items = await this.mapNotifications(result.notifications);

    return new Response.SuccessResponse({
      data: {
        items,
        cursor: result.nextCursor || null,
        hasNext: !!result.nextCursor,
        unreadCount,
      },
    });
  }

  private async mapNotifications(notifications: NotificationEntity[]) {
    // Collect ALL unique actor IDs (from both actorId + latestActors)
    const allActorIds = new Set<string>();
    for (const notification of notifications) {
      if (notification.latestActors.length > 0) {
        notification.latestActors.forEach((id) => allActorIds.add(id));
      }
      const singleActorId = notification.data.actorId;
      if (singleActorId) {
        allActorIds.add(singleActorId);
      }
    }

    const actorIds = [...allActorIds];
    const actors = actorIds.length
      ? await this.userRepo.findByIds(actorIds, {
          fields: ["username", "firstName", "lastName", "profilePicture", "isVerified"],
        })
      : [];

    const actorMap = new Map(
      actors.filter((actor) => !!actor.id).map((actor) => [actor.id!, actor]),
    );
    const avatarMediaIds = actors
      .map((actor) =>
        typeof actor.data.profilePicture === "string" ? actor.data.profilePicture : undefined,
      )
      .filter((id): id is string => !!id);

    const avatarMediaEntities = await this.mediaRepo.findByIds([...new Set(avatarMediaIds)]);
    const avatarRecord = toMediaRecord(avatarMediaEntities);

    return notifications.map((notification) => {
      if (notification.isAggregated) {
        return this.mapAggregatedNotification(notification, actorMap, avatarRecord);
      }
      return this.mapNonAggregatedNotification(notification, actorMap, avatarRecord);
    });
  }

  /**
   * Map AGGREGATED notification (post_like).
   * Returns `actors[]` array (top 2) + `totalActorCount`.
   * Also includes `actor` (first actor) for backward compatibility.
   */
  private mapAggregatedNotification(
    notification: NotificationEntity,
    actorMap: Map<string, any>,
    avatarRecord: Record<string, any>,
  ) {
    const actorDTOs = notification.latestActors
      .map((actorId) => {
        const actor = actorMap.get(actorId);
        if (!actor) return null;
        const dto = UserMapper.toAuthorDTO(actor, avatarRecord, this.storageSvc);
        return { ...dto, profilePicture: dto.profilePicture ?? null };
      })
      .filter((dto): dto is AuthorDTO & { profilePicture: any } => dto !== null);

    return {
      id: notification.id,
      type: notification.type,
      actor: actorDTOs[0] ?? null,
      actors: actorDTOs,
      totalActorCount: notification.totalActorCount,
      targetId: notification.targetId,
      referenceId: notification.referenceId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  /**
   * Map NON-AGGREGATED notification (follow, comment, mention).
   * Returns single `actor` + `totalActorCount: 1`.
   * Also includes `actors: [actor]` for FE consistency.
   */
  private mapNonAggregatedNotification(
    notification: NotificationEntity,
    actorMap: Map<string, any>,
    avatarRecord: Record<string, any>,
  ) {
    const singleActorId = notification.data.actorId ?? notification.actorId;
    const actor = singleActorId ? actorMap.get(singleActorId) : undefined;

    const actorDTO = actor
      ? UserMapper.toAuthorDTO(actor, avatarRecord, this.storageSvc)
      : {
          id: singleActorId || "",
          username: "unknown",
          displayName: "Unknown user",
          isVerified: false,
          profilePicture: undefined,
        };

    const normalizedActor = {
      ...actorDTO,
      profilePicture: actorDTO.profilePicture ?? null,
    };

    return {
      id: notification.id,
      type: notification.type,
      actor: normalizedActor,
      actors: [normalizedActor],
      totalActorCount: 1,
      targetId: notification.targetId,
      referenceId: notification.referenceId,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}
