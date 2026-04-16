import { Schema, model, Document, Types } from "mongoose";

export interface ICommentLikeDocument extends Document {
  userId: Types.ObjectId;
  commentId: Types.ObjectId;
  createdAt: Date;
}

const commentLikeSchema = new Schema<ICommentLikeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    commentId: { type: Schema.Types.ObjectId, ref: "Comment", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Unique constraint: one like per user per comment
commentLikeSchema.index({ userId: 1, commentId: 1 }, { unique: true });

// Query likes by comment (for batch check)
commentLikeSchema.index({ commentId: 1, _id: -1 });

export const CommentLikeModel = model<ICommentLikeDocument>("CommentLike", commentLikeSchema);
