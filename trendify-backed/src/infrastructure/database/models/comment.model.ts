import { Schema, model, Document, Types } from "mongoose";
import { ICommentProps, ECommentStatus } from "@/domain/comment";

export interface ICommentDocument
  extends Omit<ICommentProps, "postId" | "authorId" | "parentId" | "rootCommentId">,
    Document {
  postId: Types.ObjectId;
  authorId: Types.ObjectId;
  parentId?: Types.ObjectId;
  rootCommentId?: Types.ObjectId;
}

const mentionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    startIndex: { type: Number, required: true },
    endIndex: { type: Number, required: true },
  },
  { _id: false },
);

const commentSchema = new Schema<ICommentDocument>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    rootCommentId: { type: Schema.Types.ObjectId, ref: "Comment", default: null },

    content: { type: String, required: true, maxlength: 2200 },
    mentions: { type: [mentionSchema], default: [] },

    replyCount: { type: Number, default: 0, min: 0 },
    likeCount: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: Object.values(ECommentStatus),
      default: ECommentStatus.ACTIVE,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================================
// INDEXES
// ============================================================================

// Top-level comments for a post (cursor pagination, newest first)
commentSchema.index(
  { postId: 1, parentId: 1, status: 1, _id: -1 },
  { name: "post_top_level_comments" },
);

// Replies to a comment (cursor pagination, chronological)
commentSchema.index({ parentId: 1, status: 1, _id: 1 }, { name: "comment_replies" });

// Comments by author
commentSchema.index({ authorId: 1, _id: -1 }, { name: "author_comments" });

// Cleanup: all comments for a post
commentSchema.index({ postId: 1 }, { name: "post_all_comments" });

export const CommentModel = model<ICommentDocument>("Comment", commentSchema);
