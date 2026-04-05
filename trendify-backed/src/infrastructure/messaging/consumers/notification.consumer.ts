import { BaseConsumer, ConsumerConfig } from "../consumer.base";
import {
  FollowNotificationMessage,
  PostCommentMessage,
  PostLikeMessage,
  ROUTING_KEYS,
} from "@/domain/events";
import { ENotificationType, NotificationEntity } from "@/domain/notification";
import { MongooseNotificationRepository } from "@/infrastructure/database/repositories/notification.repository.impl";
import {
  MongooseLikeRepository,
  MongooseMediaRepository,
  MongooseUserRepository,
} from "@/infrastructure/database/repositories";
import { toMediaRecord } from "@/application/mappers/media.mapper";
import { UserMapper } from "@/application/mappers";
import S3Service from "@/infrastructure/services/s3.service";
import { getIO } from "@/config/socket.config";

/**
 * Notification Consumer
 *
 * Tại sao dùng RabbitMQ consumer riêng thay vì inline trong usecase?
 * 1. Tách biệt concern: usecase chỉ lo business logic, notification là side-effect
 * 2. Async: không block response time của API
 * 3. Retry: nếu DB lỗi, message quay lại queue và retry
 * 4. Scale: có thể chạy nhiều consumer instances
 *
 * Consumer listen cùng routing keys với CounterConsumer (counter.post-like, counter.post-comment).
 * Mỗi event được xử lý bởi cả 2 consumers (fan-out qua 2 queues khác nhau).
 */
export class NotificationConsumer extends BaseConsumer {
  private readonly userRepo = new MongooseUserRepository();
  private readonly mediaRepo = new MongooseMediaRepository();
  private readonly storageSvc = new S3Service();

  constructor() {
    const config: ConsumerConfig = {
      queueName: "notification.queue",
      prefetch: 10,
      retryLimit: 3,
      retryDelay: 1000,
    };

    super(config);
  }

  protected registerHandlers(): void {
    this.register<PostLikeMessage["data"]>(
      ROUTING_KEYS.COUNTER_POST_LIKE,
      this.handlePostLike.bind(this),
    );

    this.register<PostCommentMessage["data"]>(
      ROUTING_KEYS.COUNTER_POST_COMMENT,
      this.handlePostComment.bind(this),
    );

    this.register<FollowNotificationMessage["data"]>(
      ROUTING_KEYS.COUNTER_FOLLOW_NOTIFICATION,
      this.handleFollowNotification.bind(this),
    );
  }

  // ===========================================================================
  // POST LIKE — AGGREGATED notification
  // ===========================================================================

  /**
   * Like notification:
   * - delta > 0 (like):  Upsert aggregate, push actor to front
   * - delta < 0 (unlike): Remove actor, decrement count, fill replacement
   * - Skip self-like (likerId === postAuthorId)
   *
   * Result: 200 người like cùng 1 post = 1 notification document
   * "X, Y và 198 người khác đã thích bài viết của bạn."
   */
  private async handlePostLike(data: PostLikeMessage["data"]): Promise<void> {
    const { postId, postAuthorId, likerId, delta } = data;

    // Không tự gửi notification cho chính mình
    if (likerId === postAuthorId) return;

    const notificationRepo = new MongooseNotificationRepository();

    // ===== LIKE =====
    if (delta > 0) {
      const saved = await notificationRepo.upsertAggregated({
        recipientId: postAuthorId,
        type: ENotificationType.POST_LIKE,
        targetId: postId,
        actorId: likerId,
      });

      const actor = await this.buildActorDTOSafe(likerId);

      // Emit "notification:updated" — FE upserts by notification ID
      this.emitAggregatedUpdate(postAuthorId, saved, actor);
      await this.emitUnreadCount(postAuthorId, notificationRepo);
      return;
    }

    // ===== UNLIKE =====
    if (delta < 0) {
      // Find 2 most recent likers (excluding the un-liker) as potential replacements
      const likeRepo = new MongooseLikeRepository();
      const { likes } = await likeRepo.findByPost(postId, 3);
      const replacementActorIds = likes
        .map((l) => l.userId)
        .filter((id) => id !== likerId && id !== postAuthorId);

      await notificationRepo.removeActorFromAggregated({
        recipientId: postAuthorId,
        type: ENotificationType.POST_LIKE,
        targetId: postId,
        actorId: likerId,
        replacementActorIds,
      });

      await this.emitUnreadCount(postAuthorId, notificationRepo);
    }
  }

  // ===========================================================================
  // POST COMMENT — NON-AGGREGATED
  // ===========================================================================

  /**
   * Comment notification: Ai đó comment vào bài viết của tôi
   * + Mention notification: Ai đó @mention tôi trong comment
   */
  private async handlePostComment(data: PostCommentMessage["data"]): Promise<void> {
    const { postId, postAuthorId, commentId, commenterId, mentions } = data;

    const notificationRepo = new MongooseNotificationRepository();

    // 1. Notification cho post author (nếu không phải chính mình comment)
    const actor = await this.buildActorDTOSafe(commenterId);

    if (commenterId !== postAuthorId) {
      const notification = NotificationEntity.create({
        recipientId: postAuthorId,
        actorId: commenterId,
        type: ENotificationType.POST_COMMENT,
        targetId: postId,
        referenceId: commentId,
      });

      const saved = await notificationRepo.upsert(notification);
      this.emitToUser(postAuthorId, saved, actor);
      await this.emitUnreadCount(postAuthorId, notificationRepo);
    }

    // 2. Notification cho mỗi user được @mention
    if (mentions && mentions.length > 0) {
      for (const mention of mentions) {
        if (mention.userId === commenterId) continue;
        if (mention.userId === postAuthorId) continue;

        const notification = NotificationEntity.create({
          recipientId: mention.userId,
          actorId: commenterId,
          type: ENotificationType.POST_MENTION,
          targetId: postId,
          referenceId: commentId,
        });

        const saved = await notificationRepo.upsert(notification);
        this.emitToUser(mention.userId, saved, actor);
        await this.emitUnreadCount(mention.userId, notificationRepo);
      }
    }
  }

  // ===========================================================================
  // FOLLOW — NON-AGGREGATED
  // ===========================================================================

  /**
   * Follow notification:
   * - FOLLOW: "xxx đã bắt đầu theo dõi bạn."
   * - FOLLOW_REQUEST: "xxx muốn theo dõi bạn."
   */
  private async handleFollowNotification(data: FollowNotificationMessage["data"]): Promise<void> {
    const { actorId, recipientId, notificationType } = data;

    if (!actorId || !recipientId) return;
    if (actorId === recipientId) return;

    const notificationRepo = new MongooseNotificationRepository();

    const notification = NotificationEntity.create({
      recipientId,
      actorId,
      type:
        notificationType === "follow_request"
          ? ENotificationType.FOLLOW_REQUEST
          : ENotificationType.FOLLOW,
      targetId: actorId,
    });

    const saved = await notificationRepo.upsert(notification);
    const actor = await this.buildActorDTOSafe(actorId);

    this.emitToUser(recipientId, saved, actor);
    await this.emitUnreadCount(recipientId, notificationRepo);
  }

  // ===========================================================================
  // SOCKET EMITTERS
  // ===========================================================================

  /**
   * Emit NON-AGGREGATED notification (follow, comment, mention).
   * Uses "notification:new" event — FE creates a new item.
   */
  private emitToUser(
    userId: string,
    notification: NotificationEntity,
    actor: ReturnType<typeof UserMapper.toAuthorDTO> | null,
  ): void {
    const fallbackActor = {
      id: notification.actorId,
      username: "unknown",
      displayName: "Unknown user",
      isVerified: false,
      profilePicture: null,
    };

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit("notification:new", {
        id: notification.id,
        type: notification.type,
        actor: {
          ...(actor || fallbackActor),
          profilePicture: actor?.profilePicture ?? null,
        },
        targetId: notification.targetId,
        referenceId: notification.referenceId,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("[NotificationConsumer] Failed to emit socket event:", error);
    }
  }

  /**
   * Emit AGGREGATED notification update (post_like).
   * Uses "notification:updated" event — FE upserts by notification ID.
   *
   * Payload includes the latest actor who triggered the event + total count.
   * FE merges this into its local state.
   */
  private emitAggregatedUpdate(
    userId: string,
    notification: NotificationEntity,
    actor: ReturnType<typeof UserMapper.toAuthorDTO> | null,
  ): void {
    const fallbackActor = {
      id: notification.actorId,
      username: "unknown",
      displayName: "Unknown user",
      isVerified: false,
      profilePicture: null,
    };

    try {
      const io = getIO();
      io.to(`user:${userId}`).emit("notification:updated", {
        id: notification.id,
        type: notification.type,
        actor: {
          ...(actor || fallbackActor),
          profilePicture: actor?.profilePicture ?? null,
        },
        totalActorCount: notification.totalActorCount,
        targetId: notification.targetId,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("[NotificationConsumer] Failed to emit aggregated event:", error);
    }
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private async buildActorDTO(actorId: string) {
    const actor = await this.userRepo.findById(actorId, {
      fields: ["username", "firstName", "lastName", "profilePicture", "isVerified"],
    });

    if (!actor || !actor.id) {
      return null;
    }

    const profilePictureId =
      typeof actor.data.profilePicture === "string" ? actor.data.profilePicture : undefined;
    const avatarMediaIds = profilePictureId ? [profilePictureId] : [];
    const avatarMediaEntities = await this.mediaRepo.findByIds([...new Set(avatarMediaIds)]);
    const avatarRecord = toMediaRecord(avatarMediaEntities);

    return UserMapper.toAuthorDTO(actor, avatarRecord, this.storageSvc);
  }

  private async buildActorDTOSafe(actorId: string) {
    try {
      return await this.buildActorDTO(actorId);
    } catch (error) {
      console.error("[NotificationConsumer] Failed to enrich notification actor:", error);
      return null;
    }
  }

  private async emitUnreadCount(
    userId: string,
    notificationRepo: MongooseNotificationRepository,
  ): Promise<void> {
    try {
      const unreadCount = await notificationRepo.countUnread(userId);
      const io = getIO();

      io.to(`user:${userId}`).emit("notification:unread-count", {
        unreadCount,
      });
    } catch (error) {
      console.error("[NotificationConsumer] Failed to emit unread count:", error);
    }
  }
}
