import { ISessionProps } from "@/domain/session";
import { Schema, model, Document } from "mongoose";

export interface ISessionDocument extends ISessionProps, Document {}

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: { type: String, required: true },
    deviceId: { type: String, required: true },

    refreshTokenHash: { type: String, required: true },

    userAgent: { type: String },
    ipAddress: { type: String },

    isRevoked: { type: Boolean, default: false },

    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

sessionSchema.index(
  { userId: 1, deviceId: 1 },
  { unique: true, partialFilterExpression: { isRevoked: false } }
);

sessionSchema.index({ userId: 1, isRevoked: 1 });

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.index({ refreshTokenHash: 1 }, { unique: true });

export const SessionModel = model<ISessionDocument>("Session", sessionSchema);
