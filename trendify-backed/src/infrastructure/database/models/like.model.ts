import { Schema, model, Document, Types } from "mongoose";
import { ILikeProps } from "@/domain/like/like.entity";

export interface ILikeDocument extends Omit<ILikeProps, "userId" | "postId">, Document {
  userId: Types.ObjectId;
  postId: Types.ObjectId;
}

const likeSchema = new Schema<ILikeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Unique constraint: one like per user per post
likeSchema.index({ userId: 1, postId: 1 }, { unique: true });

// Query likes by post (for "who liked this post" with cursor pagination)
likeSchema.index({ postId: 1, _id: -1 });

// Query likes by user (for "posts I've liked")
likeSchema.index({ userId: 1, _id: -1 });

export const LikeModel = model<ILikeDocument>("Like", likeSchema);
