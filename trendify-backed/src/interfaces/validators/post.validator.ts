import * as z from "zod";

import { ECommonVisibility } from "@/domain/user-setting";
import { EPostType } from "@/domain/post";
import { MONGODB_OBJECTID_REGEX } from "@/shared/constants/regex.constant";

// ============================================================================
// PARAM SCHEMAS
// ============================================================================

export const postIdParamSchema = z.object({
  postId: z
    .string()
    .nonempty({ message: "Post ID is required" })
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
      message: "Invalid post ID",
    }),
});

export const commentIdParamSchema = z.object({
  postId: z
    .string()
    .nonempty({ message: "Post ID is required" })
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
      message: "Invalid post ID",
    }),
  commentId: z
    .string()
    .nonempty({ message: "Comment ID is required" })
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
      message: "Invalid comment ID",
    }),
});

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

export const paginationQuerySchema = z.object({
  cursor: z
    .string()
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), { message: "Invalid cursor" })
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
});

export const userPostsQuerySchema = z.object({
  cursor: z
    .string()
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), { message: "Invalid cursor" })
    .optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
  type: z.nativeEnum(EPostType).optional(),
});

// ============================================================================
// BODY SCHEMAS
// ============================================================================

const mentionSchema = z.object({
  userId: z
    .string()
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), { message: "Invalid user ID" }),
  username: z.string().min(1).max(50),
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
});

const mediaIdSchema = z
  .string()
  .refine((v) => MONGODB_OBJECTID_REGEX.test(v), { message: "Invalid media ID" });

const locationSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(500).optional(),
  placeId: z.string().max(200).optional(),
  coordinates: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

export const createPostSchema = z
  .object({
    content: z
      .string()
      .max(2200, { message: "Content must be at most 2200 characters" })
      .optional(),
    mediaIds: z
      .array(mediaIdSchema)
      .max(10, { message: "Maximum 10 media files per post" })
      .optional(),
    mentions: z.array(mentionSchema).max(20).optional(),
    location: locationSchema.optional(),
    visibility: z
      .nativeEnum(ECommonVisibility, { message: "Invalid visibility" })
      .optional(),
    replyToId: z
      .string()
      .refine((v) => MONGODB_OBJECTID_REGEX.test(v), { message: "Invalid reply ID" })
      .optional(),
    isDraft: z.boolean().optional(),
  })
  .refine((data) => data.content?.trim() || (data.mediaIds && data.mediaIds.length > 0), {
    message: "Post must have content or media",
  });

export const updatePostSchema = z
  .object({
    content: z
      .string()
      .max(2200, { message: "Content must be at most 2200 characters" })
      .optional(),
    mediaIds: z
      .array(mediaIdSchema)
      .max(10, { message: "Maximum 10 media files per post" })
      .optional(),
    mentions: z.array(mentionSchema).max(20).optional(),
    location: locationSchema.nullable().optional(),
    visibility: z
      .nativeEnum(ECommonVisibility, { message: "Invalid visibility" })
      .optional(),
    allowLike: z.boolean().optional(),
    allowSave: z.boolean().optional(),
    allowShare: z.boolean().optional(),
    allowComment: z.boolean().optional(),
    allowDownload: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be updated",
  });

export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, { message: "Comment cannot be empty" })
    .max(2200, { message: "Comment must be at most 2200 characters" }),
  parentId: z
    .string()
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), { message: "Invalid parent comment ID" })
    .optional(),
  mentions: z.array(mentionSchema).max(10).optional(),
});
