import { Schema, model, Document, Types } from "mongoose";
import { ISearchHistoryProps, ESearchType } from "@/domain/search";

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface ISearchHistoryDocument
  extends Omit<ISearchHistoryProps, "userId">,
    Document {
  userId: Types.ObjectId;
}

// ============================================================================
// SCHEMA
// ============================================================================

const searchHistorySchema = new Schema<ISearchHistoryDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    keyword: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    searchType: {
      type: String,
      enum: Object.values(ESearchType),
      default: ESearchType.USER,
    },
    resultCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// ============================================================================
// INDEXES
// ============================================================================

// User history query: recent searches (not deleted), sorted by updatedAt
searchHistorySchema.index(
  { userId: 1, deletedAt: 1, updatedAt: -1 },
  { name: "user_search_history" },
);

// Dedup lookup: find existing entry for same keyword within time window
searchHistorySchema.index(
  { userId: 1, keyword: 1, deletedAt: 1 },
  { name: "dedup_lookup" },
);

// Autocomplete: prefix search on keyword for a specific user
searchHistorySchema.index(
  { userId: 1, keyword: 1, deletedAt: 1, updatedAt: -1 },
  { name: "autocomplete_prefix" },
);

// TTL: tự xóa entries cũ sau 30 ngày kể từ lần update cuối
searchHistorySchema.index(
  { updatedAt: 1 },
  {
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    name: "ttl_cleanup",
  },
);

// ============================================================================
// EXPORT
// ============================================================================

export const SearchHistoryModel = model<ISearchHistoryDocument>(
  "SearchHistory",
  searchHistorySchema,
);
