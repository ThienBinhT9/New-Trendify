import { Schema, model, Document } from "mongoose";
import { IUserIntentProps, EUserIntentStatus } from "@/domain/user-intent";

export interface IUserIntentDocument extends IUserIntentProps, Document {}

const userIntentSchema = new Schema<IUserIntentDocument>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EUserIntentStatus),
      default: EUserIntentStatus.PENDING,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

userIntentSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [EUserIntentStatus.PENDING, EUserIntentStatus.VERIFIED] },
    },
  },
);

userIntentSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: {
      status: { $in: [EUserIntentStatus.PENDING, EUserIntentStatus.VERIFIED] },
    },
  },
);

userIntentSchema.index({ email: 1, status: 1 });

export const UserIntentModel = model<IUserIntentDocument>("UserIntent", userIntentSchema);
