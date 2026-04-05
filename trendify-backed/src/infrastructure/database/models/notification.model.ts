import { Schema, model, Document, Types } from "mongoose";
import { INotificationProps, ENotificationType } from "@/domain/notification";

export interface INotificationDocument
  extends Omit<INotificationProps, "recipientId" | "actorId" | "targetId" | "referenceId" | "latestActors">,
    Document {
  recipientId: Types.ObjectId;
  actorId?: Types.ObjectId;
  targetId: Types.ObjectId;
  referenceId?: Types.ObjectId;
  latestActors: Types.ObjectId[];
  totalActorCount: number;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: Object.values(ENotificationType),
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },

    // Non-aggregated (follow, mention, comment)
    actorId: { type: Schema.Types.ObjectId, default: null },

    // Aggregated (post_like)
    latestActors: { type: [Schema.Types.ObjectId], default: [] },
    totalActorCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

// ============================================================================
// INDEXES
// ============================================================================

// Notification list query: newest first, filter by read status
notificationSchema.index(
  { recipientId: 1, isRead: 1, _id: -1 },
  { name: "recipient_notifications" },
);

/**
 * Unique index for NON-AGGREGATED types (follow, follow_request, comment, mention).
 * 1 notification per (recipient + type + actor + target).
 * 
 * Partial filter ensures this index only applies to non-aggregated types,
 * avoiding conflict with the aggregated unique index below.
 */
notificationSchema.index(
  { recipientId: 1, type: 1, actorId: 1, targetId: 1 },
  {
    unique: true,
    name: "unique_non_aggregated",
    partialFilterExpression: {
      type: { $in: ["follow", "follow_request", "post_mention", "post_comment"] },
    },
  },
);

/**
 * Unique index for AGGREGATED types (post_like).
 * 1 notification per (recipient + type + target) — multiple actors grouped.
 */
notificationSchema.index(
  { recipientId: 1, type: 1, targetId: 1 },
  {
    unique: true,
    name: "unique_aggregated",
    partialFilterExpression: {
      type: { $in: ["post_like"] },
    },
  },
);

// TTL: tự xóa notification cũ sau 90 ngày
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, name: "ttl_cleanup" },
);

/**
 * MIGRATION NOTE:
 * If upgrading from the old schema, you must manually drop the old unique index:
 *   db.notifications.dropIndex("unique_notification")
 * Then let Mongoose create the new partial unique indexes above.
 * Run: db.notifications.syncIndexes() or restart the app with autoIndex enabled.
 */

export const NotificationModel = model<INotificationDocument>("Notification", notificationSchema);
