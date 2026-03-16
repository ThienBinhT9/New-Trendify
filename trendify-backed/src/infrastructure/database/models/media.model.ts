import { Schema, model, Document, Types } from "mongoose";
import {
  IMediaProps,
  EMediaPurpose,
  EMediaStatus,
  EVariantType,
  IMediaVariant,
  IMediaMetadata,
} from "@/domain/media";

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface IMediaDocument extends Omit<IMediaProps, "userId">, Document {
  userId: Types.ObjectId;
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

const MediaVariantSchema = new Schema<IMediaVariant>(
  {
    key: { type: String, required: true },
    type: { type: String, enum: Object.values(EVariantType), required: true },
    width: { type: Number },
    height: { type: Number },
    size: { type: Number, required: true },
    format: { type: String, required: true },
  },
  { _id: false },
);

const MediaMetadataSchema = new Schema<IMediaMetadata>(
  {
    width: { type: Number },
    height: { type: Number },
    duration: { type: Number },
    format: { type: String },
    codec: { type: String },
  },
  { _id: false },
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const mediaSchema = new Schema<IMediaDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    purpose: {
      type: String,
      enum: Object.values(EMediaPurpose),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(EMediaStatus),
      default: EMediaStatus.PENDING_UPLOAD,
      index: true,
    },
    variants: {
      type: [MediaVariantSchema],
      default: [],
    },
    metadata: {
      type: MediaMetadataSchema,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// ============================================================================
// INDEXES
// ============================================================================

// Compound index for user's media queries
mediaSchema.index(
  { userId: 1, purpose: 1, status: 1, _id: -1 },
  { name: "user_media_by_purpose" },
);

// TTL index for auto-cleaning expired pending uploads
mediaSchema.index(
  { expiresAt: 1 },
  {
    name: "pending_upload_ttl",
    expireAfterSeconds: 0, // Documents expire at their expiresAt value
    partialFilterExpression: { status: EMediaStatus.PENDING_UPLOAD },
  },
);

// For finding media by status (cleanup queries)
mediaSchema.index(
  { status: 1, createdAt: 1 },
  { name: "media_by_status" },
);

// ============================================================================
// VIRTUALS
// ============================================================================

mediaSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

export const MediaModel = model<IMediaDocument>("Media", mediaSchema);
