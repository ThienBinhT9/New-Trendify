import * as z from "zod";
import { MONGODB_OBJECTID_REGEX } from "@/shared/constants/regex.constant";

export const getUserPresenceSchema = z.object({
  userId: z
    .string()
    .refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
      message: "Invalid user ID format",
    }),
});

export const batchPresenceSchema = z.object({
  userIds: z
    .array(
      z.string().refine((v) => MONGODB_OBJECTID_REGEX.test(v), {
        message: "Each user ID must be a valid ObjectId",
      }),
    )
    .min(1, { message: "At least one user ID is required" })
    .max(50, { message: "Maximum 50 user IDs per batch" }),
});
