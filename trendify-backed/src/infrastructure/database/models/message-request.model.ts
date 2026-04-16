import { Schema, model, Document, Types } from "mongoose";
import { IMessageRequestProps, EMessageRequestStatus } from "@/domain/chat";

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface IMessageRequestDocument
  extends Omit<IMessageRequestProps, "senderId" | "recipientId" | "conversationId">,
    Document {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  conversationId: Types.ObjectId;
}

// ============================================================================
// SCHEMA
// ============================================================================

const messageRequestSchema = new Schema<IMessageRequestDocument>(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    status: {
      type: String,
      enum: Object.values(EMessageRequestStatus),
      default: EMessageRequestStatus.PENDING,
    },
    message: { type: String, default: null, maxlength: 500 },
  },
  {
    timestamps: true,
  },
);

// ============================================================================
// INDEXES
// ============================================================================

/**
 * Recipient inbox: pending requests sorted newest first.
 */
messageRequestSchema.index(
  { recipientId: 1, status: 1, _id: -1 },
  { name: "recipient_requests" },
);

/**
 * Unique pending request between two users — prevent duplicate requests.
 */
messageRequestSchema.index(
  { senderId: 1, recipientId: 1 },
  {
    unique: true,
    name: "unique_pending_request",
    partialFilterExpression: { status: EMessageRequestStatus.PENDING },
  },
);

/**
 * TTL: auto-cleanup declined requests after 30 days.
 */
messageRequestSchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60,
    name: "declined_ttl",
    partialFilterExpression: { status: EMessageRequestStatus.DECLINED },
  },
);

export const MessageRequestModel = model<IMessageRequestDocument>("MessageRequest", messageRequestSchema);
