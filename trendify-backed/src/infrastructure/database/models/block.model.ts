import { Schema, model, Document, Types } from "mongoose";
import { IBlockProps } from "@/domain/block";

export interface IBlockDocument extends Omit<IBlockProps, "blockerId" | "blockedId">, Document {
  blockerId: Types.ObjectId;
  blockedId: Types.ObjectId;
}

const blockSchema = new Schema<IBlockDocument>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
    reason: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: "blocks",
  },
);

// Compound unique index - prevent duplicate blocks
blockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

// Index for checking if either user blocked the other
blockSchema.index({ blockedId: 1, blockerId: 1 });

export const BlockModel = model<IBlockDocument>("Block", blockSchema);
