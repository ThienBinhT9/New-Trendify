import { Schema, model, Document, Types } from "mongoose";
import { IRecentlyViewedProps, EViewedResourceType } from "@/domain/search";

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface IRecentlyViewedDocument
  extends Omit<IRecentlyViewedProps, "userId" | "resourceId">,
    Document {
  userId: Types.ObjectId;
  resourceId: Types.ObjectId;
}

// ============================================================================
// SCHEMA
// ============================================================================

const recentlyViewedSchema = new Schema<IRecentlyViewedDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    resourceType: {
      type: String,
      enum: Object.values(EViewedResourceType),
      required: true,
    },
    viewedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // Dùng viewedAt thay cho timestamps
  },
);

// ============================================================================
// INDEXES
// ============================================================================

// Unique constraint for upsert: 1 entry per (user, resource, type)
recentlyViewedSchema.index(
  { userId: 1, resourceId: 1, resourceType: 1 },
  { unique: true, name: "unique_user_resource" },
);

// Recent query: viewed items sorted by viewedAt desc
recentlyViewedSchema.index(
  { userId: 1, viewedAt: -1 },
  { name: "user_recent_viewed" },
);

// TTL: tự xóa sau 30 ngày
recentlyViewedSchema.index(
  { viewedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    name: "ttl_cleanup",
  },
);

// ============================================================================
// EXPORT
// ============================================================================

export const RecentlyViewedModel = model<IRecentlyViewedDocument>(
  "RecentlyViewed",
  recentlyViewedSchema,
);
