import * as z from "zod";

export const getFollowListQuerySchema = z.object({
  query: z.string().trim().optional(),

  cursor: z.string().trim().optional(),

  limit: z.coerce.number().int().min(1).max(50).optional().default(20),

  page: z.coerce.number().int().min(1).optional().default(1),
});
