import { Types } from "mongoose";

import {
  INotificationRepository,
  NotificationEntity,
  INotificationProps,
} from "@/domain/notification";
import { NotificationModel } from "../models/notification.model";
import { BaseRepository } from "./base.repository";

export class MongooseNotificationRepository
  extends BaseRepository<NotificationEntity, INotificationProps>
  implements INotificationRepository
{
  /**
   * Upsert notification: tạo mới nếu chưa có, update timestamp nếu đã tồn tại.
   * Sử dụng unique index { recipientId, type, actorId, targetId } để tránh duplicate.
   * Ví dụ: user A like post X → chỉ có 1 notification dù API gọi nhiều lần.
   */
  async upsert(notification: NotificationEntity): Promise<NotificationEntity> {
    const data = notification.data;

    const doc = await NotificationModel.findOneAndUpdate(
      {
        recipientId: new Types.ObjectId(data.recipientId),
        type: data.type,
        actorId: new Types.ObjectId(data.actorId),
        targetId: new Types.ObjectId(data.targetId),
      },
      {
        $set: {
          referenceId: data.referenceId ? new Types.ObjectId(data.referenceId) : null,
          isRead: false, // Reset read status khi notification được trigger lại
        },
        $setOnInsert: {
          recipientId: new Types.ObjectId(data.recipientId),
          type: data.type,
          actorId: new Types.ObjectId(data.actorId),
          targetId: new Types.ObjectId(data.targetId),
        },
      },
      {
        upsert: true,
        new: true,
        lean: true,
      },
    );

    return this.mapToEntity(doc, NotificationEntity);
  }

  /**
   * Cursor-based pagination cho notification list.
   * Sắp xếp newest first (_id descending).
   */
  async findByRecipient(
    recipientId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ notifications: NotificationEntity[]; nextCursor?: string }> {
    const query: any = {
      recipientId: new Types.ObjectId(recipientId),
    };

    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const docs = await NotificationModel.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasNext = docs.length > limit;
    const sliced = hasNext ? docs.slice(0, limit) : docs;

    return {
      notifications: sliced.map((doc) => this.mapToEntity(doc, NotificationEntity)),
      nextCursor: hasNext ? sliced[sliced.length - 1]._id.toString() : undefined,
    };
  }

  async findByRecipientSince(
    recipientId: string,
    since: Date,
    limit: number,
  ): Promise<NotificationEntity[]> {
    const docs = await NotificationModel.find({
      recipientId: new Types.ObjectId(recipientId),
      createdAt: { $gt: since },
    })
      .sort({ _id: -1 })
      .limit(limit)
      .lean();

    return docs.map((doc) => this.mapToEntity(doc, NotificationEntity));
  }

  async markAsRead(notificationId: string, recipientId: string): Promise<boolean> {
    const result = await NotificationModel.updateOne(
      {
        _id: new Types.ObjectId(notificationId),
        recipientId: new Types.ObjectId(recipientId),
      },
      { $set: { isRead: true } },
    );

    return result.modifiedCount > 0;
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    const result = await NotificationModel.updateMany(
      {
        recipientId: new Types.ObjectId(recipientId),
        isRead: false,
      },
      { $set: { isRead: true } },
    );

    return result.modifiedCount;
  }

  async countUnread(recipientId: string): Promise<number> {
    return NotificationModel.countDocuments({
      recipientId: new Types.ObjectId(recipientId),
      isRead: false,
    });
  }

  // ====================== MAPPING ======================

  protected override mapToEntity(
    doc: any,
    EntityClass: new (props: INotificationProps, id?: string) => NotificationEntity,
  ): NotificationEntity {
    if (!doc) throw new Error("Document not found");

    const { _id, __v, recipientId, actorId, targetId, referenceId, createdAt, updatedAt, ...rest } =
      doc;

    const props: INotificationProps = {
      ...rest,
      recipientId: recipientId.toString(),
      actorId: actorId.toString(),
      targetId: targetId.toString(),
      referenceId: referenceId?.toString() ?? undefined,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    return new EntityClass(props, _id.toString());
  }
}
