import { Schema, model, Document, Types } from "mongoose";
import { ISaveProps } from "@/domain/save/save.entity";

export interface ISaveDocument extends Omit<ISaveProps, "userId" | "postId">, Document {
  userId: Types.ObjectId;
  postId: Types.ObjectId;
}

const saveSchema = new Schema<ISaveDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Unique constraint: one save per user per post
saveSchema.index({ userId: 1, postId: 1 }, { unique: true });

// Query saved posts by user (for "my saved posts" with cursor pagination)
// Primary query pattern - user viewing their saved posts
saveSchema.index({ userId: 1, _id: -1 });

export const SaveModel = model<ISaveDocument>("Save", saveSchema);
