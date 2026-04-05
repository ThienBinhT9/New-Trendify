import { Types } from "mongoose";

import {
  INotificationRepository,
  NotificationEntity,
  INotificationProps,
  ENotificationType,
} from "@/domain/notification";
import { NotificationModel } from "../models/notification.model";
import { BaseRepository } from "./base.repository";

export class MongooseNotificationRepository
  extends BaseRepository<NotificationEntity, INotificationProps>
  implements INotificationRepository
{
  /**
   * Upsert NON-AGGREGATED notification (follow, comment, mention).
   * Uses unique index { recipientId, type, actorId, targetId }.
   */
  async upsert(notification: NotificationEntity): Promise<NotificationEntity> {
    const data = notification.data;

    const doc = await NotificationModel.findOneAndUpdate(
      {
        recipientId: new Types.ObjectId(data.recipientId),
        type: data.type,
        actorId: new Types.ObjectId(data.actorId!),
        targetId: new Types.ObjectId(data.targetId),
      },
      {
        $set: {
          referenceId: data.referenceId ? new Types.ObjectId(data.referenceId) : null,
          isRead: false,
        },
        $setOnInsert: {
          recipientId: new Types.ObjectId(data.recipientId),
          type: data.type,
          actorId: new Types.ObjectId(data.actorId!),
          targetId: new Types.ObjectId(data.targetId),
          latestActors: [],
          totalActorCount: 1,
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
   * Atomic upsert for AGGREGATED notification (POST_LIKE).
   *
   * Strategy:
   * 1. $pull actor if already in latestActors (handles re-like, prevents duplicate)
   * 2. $push actor to position 0 + $slice 2 + $inc totalActorCount + upsert
   *
   * The $pull in step 1 is a no-op if the actor isn't there (new like).
   * Two operations are needed because MongoDB doesn't allow $pull + $push
   * on the same array in one update.
   */
  async upsertAggregated(input: {
    recipientId: string;
    type: ENotificationType;
    targetId: string;
    actorId: string;
  }): Promise<NotificationEntity> {
    const { recipientId, type, targetId, actorId } = input;

    const filter = {
      recipientId: new Types.ObjectId(recipientId),
      type,
      targetId: new Types.ObjectId(targetId),
    };

    const actorOid = new Types.ObjectId(actorId);

    // Step 1: Remove actor if already present (prevent duplicate on re-like)
    await NotificationModel.updateOne(filter, {
      $pull: { latestActors: actorOid },
    });

    // Step 2: Push actor to front, increment count, upsert if not exists
    const doc = await NotificationModel.findOneAndUpdate(
      filter,
      {
        $push: {
          latestActors: {
            $each: [actorOid],
            $position: 0,
            $slice: 2,
          },
        },
        $inc: { totalActorCount: 1 },
        $set: { isRead: false },
        $setOnInsert: {
          recipientId: new Types.ObjectId(recipientId),
          type,
          targetId: new Types.ObjectId(targetId),
          actorId: null,
        },
      },
      { upsert: true, new: true, lean: true },
    );

    return this.mapToEntity(doc, NotificationEntity);
  }

  /**
   * Remove actor from aggregated notification (unlike).
   *
   * - Pulls actor from latestActors + decrements totalActorCount
   * - If count reaches 0 → delete the notification entirely
   * - If latestActors < 2 and replacements provided → fill with replacements
   */
  async removeActorFromAggregated(input: {
    recipientId: string;
    type: ENotificationType;
    targetId: string;
    actorId: string;
    replacementActorIds?: string[];
  }): Promise<void> {
    const { recipientId, type, targetId, actorId, replacementActorIds } = input;

    const filter = {
      recipientId: new Types.ObjectId(recipientId),
      type,
      targetId: new Types.ObjectId(targetId),
    };

    const result = await NotificationModel.findOneAndUpdate(
      filter,
      {
        $pull: { latestActors: new Types.ObjectId(actorId) },
        $inc: { totalActorCount: -1 },
      },
      { new: true, lean: true },
    );

    if (!result) return;

    // If count reached 0, delete the notification entirely
    if (result.totalActorCount <= 0) {
      await NotificationModel.deleteOne({ _id: result._id });
      return;
    }

    // If latestActors needs refilling and we have replacements
    if (result.latestActors.length < 2 && replacementActorIds?.length) {
      const existingSet = new Set(
        result.latestActors.map((id: Types.ObjectId) => id.toString()),
      );
      const newActors = replacementActorIds
        .filter((id) => !existingSet.has(id) && id !== actorId)
        .slice(0, 2 - result.latestActors.length)
        .map((id) => new Types.ObjectId(id));

      if (newActors.length > 0) {
        await NotificationModel.updateOne(
          { _id: result._id },
          { $push: { latestActors: { $each: newActors } } },
        );
      }
    }
  }

  /**
   * Cursor-based pagination cho notification list.
   * Sắp xếp newest first (_id descending).
   */
  async findByRecipient(
    recipientId: string,
    limit: number,
    cursor?: string,
    isRead?: boolean,
  ): Promise<{ notifications: NotificationEntity[]; nextCursor?: string }> {
    const query: any = {
      recipientId: new Types.ObjectId(recipientId),
    };

    if (typeof isRead === "boolean") {
      query.isRead = isRead;
    }

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
    isRead?: boolean,
  ): Promise<NotificationEntity[]> {
    const filter: any = {
      recipientId: new Types.ObjectId(recipientId),
      createdAt: { $gt: since },
    };

    if (typeof isRead === "boolean") {
      filter.isRead = isRead;
    }

    const docs = await NotificationModel.find(filter)
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

  async deleteFollowNotification(
    actorId: string,
    recipientId: string,
    type: "follow" | "follow_request",
  ): Promise<boolean> {
    const notificationType =
      type === "follow" ? ENotificationType.FOLLOW : ENotificationType.FOLLOW_REQUEST;

    const result = await NotificationModel.deleteOne({
      recipientId: new Types.ObjectId(recipientId),
      actorId: new Types.ObjectId(actorId),
      type: notificationType,
      targetId: new Types.ObjectId(actorId),
    });

    return result.deletedCount > 0;
  }

  // ====================== MAPPING ======================

  protected override mapToEntity(
    doc: any,
    EntityClass: new (props: INotificationProps, id?: string) => NotificationEntity,
  ): NotificationEntity {
    if (!doc) throw new Error("Document not found");

    const {
      _id,
      __v,
      recipientId,
      actorId,
      targetId,
      referenceId,
      latestActors,
      totalActorCount,
      createdAt,
      updatedAt,
      ...rest
    } = doc;

    const props: INotificationProps = {
      ...rest,
      recipientId: recipientId.toString(),
      actorId: actorId?.toString() ?? undefined,
      targetId: targetId.toString(),
      referenceId: referenceId?.toString() ?? undefined,
      latestActors: Array.isArray(latestActors)
        ? latestActors.map((id: Types.ObjectId) => id.toString())
        : [],
      totalActorCount: totalActorCount ?? (actorId ? 1 : 0),
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
    };

    return new EntityClass(props, _id.toString());
  }
}
