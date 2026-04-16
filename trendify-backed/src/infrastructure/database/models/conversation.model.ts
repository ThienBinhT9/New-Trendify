import { Schema, model, Document, Types } from "mongoose";
import {
  IConversationProps,
  EConversationType,
  EConversationRole,
} from "@/domain/chat";

// ============================================================================
// SUB-DOCUMENT INTERFACES
// ============================================================================

export interface ILastMessageSnapshotDocument {
  messageId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  type: string;
  createdAt: Date;
}

export interface IConversationMemberDocument {
  userId: Types.ObjectId;
  role: string;
  joinedAt: Date;
  lastReadMessageId?: Types.ObjectId;
  lastReadAt?: Date;
  mutedUntil?: Date | null;
  isArchived: boolean;
  isPinned: boolean;
}

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface IConversationDocument
  extends Omit<IConversationProps, "members" | "createdBy" | "lastMessage" | "pinnedMessageIds">,
    Document {
  members: IConversationMemberDocument[];
  createdBy: Types.ObjectId;
  lastMessage?: ILastMessageSnapshotDocument;
  pinnedMessageIds: Types.ObjectId[];
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const LastMessageSnapshotSchema = new Schema<ILastMessageSnapshotDocument>(
  {
    messageId: { type: Schema.Types.ObjectId, required: true },
    senderId: { type: Schema.Types.ObjectId, required: true },
    content: { type: String, default: "" },
    type: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const ConversationMemberSchema = new Schema<IConversationMemberDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: Object.values(EConversationRole),
      default: EConversationRole.MEMBER,
    },
    joinedAt: { type: Date, default: Date.now },
    lastReadMessageId: { type: Schema.Types.ObjectId, default: null },
    lastReadAt: { type: Date, default: null },
    mutedUntil: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
  },
  { _id: false },
);

const ConversationSettingsSchema = new Schema(
  {
    themeId: { type: String, default: "classic" },
    quickEmoji: { type: String, default: "👍" },
    nicknames: { type: Map, of: String, default: {} },
  },
  { _id: false }
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const conversationSchema = new Schema<IConversationDocument>(
  {
    type: {
      type: String,
      enum: Object.values(EConversationType),
      required: true,
    },
    members: {
      type: [ConversationMemberSchema],
      required: true,
      validate: {
        validator: (members: IConversationMemberDocument[]) => members.length >= 2,
        message: "A conversation must have at least 2 members",
      },
    },
    name: { type: String, default: null, maxlength: 100 },
    avatarMediaId: { type: Schema.Types.ObjectId, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastMessage: { type: LastMessageSnapshotSchema, default: null },
    pinnedMessageIds: { type: [Schema.Types.ObjectId], default: [] },
    settings: { type: ConversationSettingsSchema, default: () => ({}) },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
);

// ============================================================================
// INDEXES
// ============================================================================

/**
 * Primary inbox query: Get conversations for a user, sorted by latest activity.
 * Supports filtering by archive/pin status per member.
 */
conversationSchema.index(
  { "members.userId": 1, "lastMessage.createdAt": -1 },
  { name: "member_inbox" },
);

/**
 * Direct conversation lookup: Find existing DM between two users.
 * Partial filter reduces index size to only direct conversations.
 */
conversationSchema.index(
  { type: 1, "members.userId": 1 },
  {
    name: "direct_conversation_lookup",
    partialFilterExpression: { type: EConversationType.DIRECT },
  },
);

/**
 * Member archive/pin filtering within inbox.
 */
conversationSchema.index(
  { "members.userId": 1, "members.isArchived": 1, "members.isPinned": 1 },
  { name: "member_inbox_filters" },
);

export const ConversationModel = model<IConversationDocument>("Conversation", conversationSchema);
