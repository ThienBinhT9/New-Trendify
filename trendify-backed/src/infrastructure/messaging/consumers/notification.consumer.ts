import { BaseConsumer, ConsumerConfig } from "../consumer.base";
import { PostLikeMessage, PostCommentMessage, ROUTING_KEYS } from "@/domain/events";
import { ENotificationType, NotificationEntity } from "@/domain/notification";
import { MongooseNotificationRepository } from "@/infrastructure/database/repositories/notification.repository.impl";
import {
  MongooseMediaRepository,
  MongooseUserRepository,
} from "@/infrastructure/database/repositories";
import { fetchMediaRecordFromGroups } from "@/application/mappers/media.mapper";
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
  }

  /**
   * Like notification: Ai đó like bài viết của tôi
   *
   * - recipientId = post author (người nhận notification)
   * - actorId = liker (người thực hiện action)
   * - targetId = postId (bài viết được like)
   * - Skip nếu unlike (delta < 0) hoặc self-like
   */
  private async handlePostLike(data: PostLikeMessage["data"]): Promise<void> {
    const { postId, postAuthorId, likerId, delta } = data;

    // Chỉ tạo notification khi like (delta > 0), không tạo khi unlike
    if (delta <= 0) return;

    // Không tự gửi notification cho chính mình
    if (likerId === postAuthorId) return;

    const notificationRepo = new MongooseNotificationRepository();

    const notification = NotificationEntity.create({
      recipientId: postAuthorId,
      actorId: likerId,
      type: ENotificationType.POST_LIKE,
      targetId: postId,
    });

    const [saved, actor] = await Promise.all([
      notificationRepo.upsert(notification),
      this.buildActorDTO(likerId),
    ]);

    // Emit real-time tới đúng user qua Socket.IO room
    this.emitToUser(postAuthorId, saved, actor);
    await this.emitUnreadCount(postAuthorId, notificationRepo);
  }

  /**
   * Comment notification: Ai đó comment vào bài viết của tôi
   * + Mention notification: Ai đó @mention tôi trong comment
   *
   * Xử lý 2 loại notification trong cùng 1 handler vì data đã có sẵn.
   */
  private async handlePostComment(data: PostCommentMessage["data"]): Promise<void> {
    const { postId, postAuthorId, commentId, commenterId, mentions } = data;

    const notificationRepo = new MongooseNotificationRepository();

    // 1. Notification cho post author (nếu không phải chính mình comment)
    const actor = await this.buildActorDTO(commenterId);

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
        // Skip nếu mention chính mình
        if (mention.userId === commenterId) continue;

        // Skip nếu mention post author (đã nhận POST_COMMENT notification ở trên)
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

  /**
   * Emit notification tới Socket.IO room của user.
   * Room format: `user:{userId}`
   */
  private emitToUser(
    userId: string,
    notification: NotificationEntity,
    actor: ReturnType<typeof UserMapper.toAuthorDTO> | null,
  ): void {
    try {
      const io = getIO();
      io.to(`user:${userId}`).emit("notification:new", {
        id: notification.id,
        type: notification.type,
        actorId: notification.actorId,
        actor,
        targetId: notification.targetId,
        referenceId: notification.referenceId,
        isRead: notification.isRead,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch (error) {
      // Socket.IO failure không nên break notification flow
      // User vẫn nhận notification qua REST API khi refresh
      console.error("[NotificationConsumer] Failed to emit socket event:", error);
    }
  }

  private async buildActorDTO(actorId: string) {
    const actor = await this.userRepo.findById(actorId, {
      fields: ["username", "firstName", "lastName", "profilePicture", "isVerified"],
    });

    if (!actor || !actor.id) {
      return null;
    }

    const profilePictureId =
      typeof actor.data.profilePicture === "string" ? actor.data.profilePicture : undefined;
    const profilePictureIds = profilePictureId ? [profilePictureId] : [];
    const mediaRecord = await fetchMediaRecordFromGroups([profilePictureIds], (ids) =>
      this.mediaRepo.findByIds(ids),
    );

    return UserMapper.toAuthorDTO(actor, mediaRecord, this.storageSvc);
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
