import { Schema, model, Document, Types } from "mongoose";
import { INotificationProps, ENotificationType } from "@/domain/notification";

export interface INotificationDocument
  extends Omit<INotificationProps, "recipientId" | "actorId" | "targetId" | "referenceId">,
    Document {
  recipientId: Types.ObjectId;
  actorId: Types.ObjectId;
  targetId: Types.ObjectId;
  referenceId?: Types.ObjectId;
}

const notificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: Object.values(ENotificationType),
      required: true,
    },
    targetId: { type: Schema.Types.ObjectId, required: true },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    isRead: { type: Boolean, default: false },
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

// Prevent duplicate notifications (same type, actor, target for a recipient)
// Dùng upsert thay vì check trước khi insert → atomic, không race condition
notificationSchema.index(
  { recipientId: 1, type: 1, actorId: 1, targetId: 1 },
  { unique: true, name: "unique_notification" },
);

// TTL: tự xóa notification cũ sau 90 ngày
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, name: "ttl_cleanup" },
);

export const NotificationModel = model<INotificationDocument>("Notification", notificationSchema);
