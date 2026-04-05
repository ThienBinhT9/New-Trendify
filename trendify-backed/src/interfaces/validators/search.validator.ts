import * as z from "zod";

import { EPostType } from "@/domain/post";
import { ESearchType, EViewedResourceType } from "@/domain/search";
import { MONGODB_OBJECTID_REGEX } from "@/shared/constants/regex.constant";

// ============================================================================
// QUERY SCHEMAS
// ============================================================================

/** GET /api/search?q=...&limit=...&cursor=... */
export const federatedSearchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  limit: z.coerce.number().int().min(1).max(20).default(5).optional(),
});

/** GET /api/search/users?q=...&limit=...&cursor=... */
export const searchUsersQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  cursor: z
    .string()
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), { message: "Invalid cursor" })
    .optional(),
});

/** GET /api/search/posts?q=...&limit=...&cursor=...&type=...&dateFrom=...&dateTo=... */
export const searchPostsQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  cursor: z
    .string()
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), { message: "Invalid cursor" })
    .optional(),
  type: z.nativeEnum(EPostType).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

/** GET /api/search/hashtags?q=...&limit=...&cursor=... */
export const searchHashtagsQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  cursor: z.string().optional(),
});

/** GET /api/search/autocomplete?q=...&limit=... */
export const autocompleteQuerySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
  limit: z.coerce.number().int().min(1).max(15).default(8).optional(),
});

/** GET /api/search/trending?limit=... */
export const trendingQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
});

/** GET /api/search/history?limit=... */
export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
});

/** GET /api/search/recently-viewed?limit=...&resourceType=... */
export const recentlyViewedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  resourceType: z.nativeEnum(EViewedResourceType).optional(),
});

// ============================================================================
// PARAM SCHEMAS
// ============================================================================

/** DELETE /api/search/history/:id */
export const searchHistoryIdParamSchema = z.object({
  id: z
    .string()
    .nonempty({ message: "Search history ID is required" })
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
      message: "Invalid search history ID",
    }),
});

// ============================================================================
// BODY SCHEMAS
// ============================================================================

/** POST /api/search/recently-viewed */
export const saveRecentlyViewedSchema = z.object({
  resourceId: z
    .string()
    .nonempty({ message: "Resource ID is required" })
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
      message: "Invalid resource ID",
    }),
  resourceType: z.nativeEnum(EViewedResourceType, {
    message: "Resource type must be 'user' or 'post'",
  }),
});
