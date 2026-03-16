import { EFollowStatus, IFollowProps } from "@/domain/follow";
import { Schema, model, Document } from "mongoose";

export interface IFollowDocument extends IFollowProps, Document {}

const followSchema: Schema = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    followingId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    status: {
      type: String,
      enum: Object.values(EFollowStatus),
      required: true,
      default: EFollowStatus.ACCEPTED,
    },
  },
  { timestamps: true },
);

// Unique constraint: one relationship per pair
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Query followers of a user (ACCEPTED only)
followSchema.index({ followingId: 1, status: 1, _id: -1 });

// Query following of a user (ACCEPTED only)
followSchema.index({ followerId: 1, status: 1, _id: -1 });

// Query pending requests TO a user
followSchema.index({ followingId: 1, status: 1, createdAt: -1 });

// Query pending requests FROM a user
followSchema.index({ followerId: 1, status: 1, createdAt: -1 });

export const FollowModel = model<IFollowDocument>("Follow", followSchema);
