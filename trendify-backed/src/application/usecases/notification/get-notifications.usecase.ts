import * as Response from "@/shared/responses";

import { GetNotificationsDTO } from "@/application/dtos/notification.dto";
import { fetchMediaRecordFromGroups } from "@/application/mappers/media.mapper";
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
    const profilePictureIds = actors
      .map((actor) =>
        typeof actor.data.profilePicture === "string" ? actor.data.profilePicture : undefined,
      )
      .filter((id): id is string => !!id);

    const mediaRecord = await fetchMediaRecordFromGroups([profilePictureIds], (ids) =>
      this.mediaRepo.findByIds(ids),
    );

    return notifications.map((notification) => {
      const actor = actorMap.get(notification.actorId);

      return {
        id: notification.id,
        type: notification.type,
        actorId: notification.actorId,
        actor: actor ? UserMapper.toAuthorDTO(actor, mediaRecord, this.storageSvc) : null,
        targetId: notification.targetId,
        referenceId: notification.referenceId,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      };
    });
  }
}
