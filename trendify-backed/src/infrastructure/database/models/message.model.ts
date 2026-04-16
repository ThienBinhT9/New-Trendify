import { Schema, model, Document, Types } from "mongoose";
import {
  IMessageProps,
  EMessageType,
} from "@/domain/chat";

// ============================================================================
// SUB-DOCUMENT INTERFACES
// ============================================================================

export interface IMessageReactionDocument {
  userId: Types.ObjectId;
  emoji: string;
  createdAt: Date;
}

export interface IMessageReadReceiptDocument {
  userId: Types.ObjectId;
  readAt: Date;
}

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface IMessageDocument
  extends Omit<
      IMessageProps,
      "conversationId" | "senderId" | "mediaIds" | "replyToId" | "forwardedFromId" | "reactions" | "readBy" | "deletedFor" | "deliveredTo"
    >,
    Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  mediaIds: Types.ObjectId[];
  replyToId?: Types.ObjectId;
  forwardedFromId?: Types.ObjectId;
  reactions: IMessageReactionDocument[];
  readBy: IMessageReadReceiptDocument[];
  deliveredTo: Types.ObjectId[];
  deletedFor: Types.ObjectId[];
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const MessageReactionSchema = new Schema<IMessageReactionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const MessageReadReceiptSchema = new Schema<IMessageReadReceiptDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const messageSchema = new Schema<IMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(EMessageType),
      required: true,
    },
    content: { type: String, default: null },
    mediaIds: { type: [Schema.Types.ObjectId], default: [] },
    replyToId: { type: Schema.Types.ObjectId, default: null },
    forwardedFromId: { type: Schema.Types.ObjectId, default: null },
    reactions: { type: [MessageReactionSchema], default: [] },
    readBy: { type: [MessageReadReceiptSchema], default: [] },
    deliveredTo: { type: [Schema.Types.ObjectId], default: [] },
    deletedFor: { type: [Schema.Types.ObjectId], default: [] },
    isUnsent: { type: Boolean, default: false },
    unsentAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

// ============================================================================
// INDEXES
// ============================================================================

/**
 * Primary message pagination: cursor-based, newest first within a conversation.
 * This is the most critical query for chat performance.
 */
messageSchema.index(
  { conversationId: 1, _id: -1 },
  { name: "conversation_messages" },
);

/**
 * Full-text search on message content within conversations.
 * Used for "search messages in this conversation" feature.
 */
messageSchema.index(
  { content: "text" },
  { name: "message_content_search" },
);

/**
 * Compound index for full-text search scoped to a conversation.
 * MongoDB text search can combine with equality filters.
 */
messageSchema.index(
  { conversationId: 1, createdAt: -1 },
  { name: "conversation_messages_by_date" },
);

/**
 * Unread count query: messages not read by a user in a conversation.
 */
messageSchema.index(
  { conversationId: 1, "readBy.userId": 1 },
  { name: "unread_count" },
);

/**
 * Sender lookup: messages by a user (for admin/moderation).
 */
messageSchema.index(
  { senderId: 1, createdAt: -1 },
  { name: "sender_messages" },
);

export const MessageModel = model<IMessageDocument>("Message", messageSchema);
