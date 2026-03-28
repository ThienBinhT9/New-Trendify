import * as Response from "@/shared/responses";

import { GetNotificationsDTO } from "@/application/dtos/notification.dto";
import { toMediaRecord } from "@/application/mappers/media.mapper";
import { UserMapper } from "@/application/mappers";
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
    const { userId, cursor, since, limit = 20 } = dto;

    const safeLimit = Math.max(1, Math.min(limit, 50));

    if (since) {
      const parsedSince = new Date(since);
      if (Number.isNaN(parsedSince.getTime())) {
        throw new Response.BadRequestError("Invalid since timestamp");
      }

      const [notifications, unreadCount] = await Promise.all([
        this.notificationRepo.findByRecipientSince(userId, parsedSince, safeLimit),
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
      this.notificationRepo.findByRecipient(userId, safeLimit, cursor),
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
    const actorIds = [...new Set(notifications.map((notification) => notification.actorId))];

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
      const actor = actorMap.get(notification.actorId);
      const actorDTO = actor
        ? UserMapper.toAuthorDTO(actor, avatarRecord, this.storageSvc)
        : {
            id: notification.actorId,
            username: "unknown",
            displayName: "Unknown user",
            isVerified: false,
            profilePicture: undefined,
          };

      return {
        id: notification.id,
        type: notification.type,
        actor: {
          ...actorDTO,
          profilePicture: actorDTO.profilePicture ?? null,
        },
        targetId: notification.targetId,
        referenceId: notification.referenceId,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      };
    });
  }
}
