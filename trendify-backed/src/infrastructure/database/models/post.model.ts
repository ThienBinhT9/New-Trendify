import { Schema, model, Document, Types } from "mongoose";
import {
  IPostProps,
  EPostStatus,
  EPostType,
  IPostSettings,
  IPostMention,
  IPostLocation,
  IPostCounters,
  IPostHashtag,
} from "@/domain/post";
import { ECommonVisibility } from "@/domain/user-setting";

// ============================================================================
// DOCUMENT INTERFACE
// ============================================================================

export interface IPostDocument
  extends Omit<IPostProps, "authorId" | "replyToId" | "rootPostId" | "mediaIds">, Document {
  authorId: Types.ObjectId;
  replyToId?: Types.ObjectId;
  rootPostId?: Types.ObjectId;
  mediaIds: Types.ObjectId[];
}

// ============================================================================
// SUB-SCHEMAS
// ============================================================================

/**
 * User mention schema
 */
const PostMentionSchema = new Schema<IPostMention>(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    startIndex: { type: Number, required: true },
    endIndex: { type: Number, required: true },
  },
  { _id: false },
);

const PostHashtagSchema = new Schema<IPostHashtag>(
  {
    tag: { type: String, required: true },
    startIndex: { type: Number, required: true },
    endIndex: { type: Number, required: true },
  },
  { _id: false },
);

/**
 * Location schema
 */
const PostLocationSchema = new Schema<IPostLocation>(
  {
    name: { type: String, required: true },
    address: { type: String },
    placeId: { type: String },
    coordinates: {
      type: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
      },
      _id: false,
    },
  },
  { _id: false },
);

/**
 * Settings schema
 */
const PostSettingsSchema = new Schema<IPostSettings>(
  {
    visibility: {
      type: String,
      enum: Object.values(ECommonVisibility),
      default: ECommonVisibility.PUBLIC,
    },
    allowLike: { type: Boolean, default: true },
    allowSave: { type: Boolean, default: true },
    allowShare: { type: Boolean, default: true },
    allowComment: { type: Boolean, default: true },
    allowDownload: { type: Boolean, default: true },
  },
  { _id: false },
);

/**
 * Counters schema
 */
const PostCountersSchema = new Schema<IPostCounters>(
  {
    likeCount: { type: Number, default: 0, min: 0 },
    viewCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    repostCount: { type: Number, default: 0, min: 0 },
    saveCount: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

// ============================================================================
// MAIN SCHEMA
// ============================================================================

const postSchema = new Schema<IPostDocument>(
  {
    // Identity
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(EPostType),
      default: EPostType.TEXT,
      index: true,
    },

    // Content
    content: {
      type: String,
      maxlength: 5000,
    },
    mediaIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Media" }],
      default: [],
      validate: {
        validator: (v: Types.ObjectId[]) => v.length <= 10,
        message: "Maximum 10 media items allowed",
      },
    },
    hashtags: {
      type: [PostHashtagSchema],
      default: [],
      index: true, // For hashtag search
    },
    mentions: {
      type: [PostMentionSchema],
      default: [],
    },

    // Relationships
    replyToId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      index: true, // For fetching replies
    },
    rootPostId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      index: true, // For thread queries
    },

    // Location
    location: {
      type: PostLocationSchema,
    },

    // Status & Settings
    status: {
      type: String,
      enum: Object.values(EPostStatus),
      default: EPostStatus.ACTIVE,
      index: true,
    },
    settings: {
      type: PostSettingsSchema,
      default: () => ({}),
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true, // For pinned posts query
    },

    // Counters
    counters: {
      type: PostCountersSchema,
      default: () => ({}),
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

// Primary: User posts query with cursor pagination
postSchema.index(
  { authorId: 1, status: 1, "settings.visibility": 1, _id: -1 },
  { name: "user_posts_cursor" },
);

// User pinned posts (for profile)
postSchema.index({ authorId: 1, isPinned: 1, status: 1, _id: -1 }, { name: "user_pinned_posts" });

// Post type queries (e.g., "show only videos")
postSchema.index({ authorId: 1, type: 1, status: 1, _id: -1 }, { name: "user_posts_by_type" });

// Hashtag trending/search
postSchema.index({ "hashtags.tag": 1, status: 1, _id: -1 }, { name: "hashtag_search" });

// Replies to a post
postSchema.index({ replyToId: 1, status: 1, _id: -1 }, { name: "post_replies" });

// Thread queries (all posts in a thread)
postSchema.index({ rootPostId: 1, status: 1, _id: 1 }, { name: "thread_posts" });

// Location-based queries (if using geo features)
postSchema.index({ "location.coordinates": "2dsphere" }, { name: "location_geo", sparse: true });

// Feed generation (recent posts from followed users)
postSchema.index(
  { status: 1, "settings.visibility": 1, createdAt: -1 },
  { name: "feed_generation" },
);

// Single post lookup
postSchema.index({ _id: 1, status: 1 });

// ============================================================================
// VIRTUALS
// ============================================================================

// Virtual for author population
postSchema.virtual("author", {
  ref: "User",
  localField: "authorId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for reply parent
postSchema.virtual("replyTo", {
  ref: "Post",
  localField: "replyToId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for reply count (computed from commentCount for now)
postSchema.virtual("replyCount").get(function () {
  return this.counters?.commentCount ?? 0;
});

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Auto-extract hashtags from content on save
postSchema.pre("save", function (next) {
  if (this.isModified("content") && this.content) {
    const hashtagRegex = /#([\p{L}\p{N}_]+)/gu;
    const hashtags: IPostHashtag[] = [];
    const seen = new Set<string>();

    for (const match of this.content.matchAll(hashtagRegex)) {
      const tag = match[1].toLowerCase();
      if (seen.has(tag)) continue;
      seen.add(tag);
      hashtags.push({
        tag,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
      if (hashtags.length === 30) break;
    }

    this.hashtags = hashtags;
  }
  next();
});

// ============================================================================
// EXPORT
// ============================================================================

export const PostModel = model<IPostDocument>("Post", postSchema);
