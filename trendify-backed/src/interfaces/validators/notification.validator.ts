import * as z from "zod";

import { MONGODB_OBJECTID_REGEX } from "@/shared/constants/regex.constant";

export const getNotificationsQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const notificationIdParamSchema = z.object({
  notificationId: z.string().trim().regex(MONGODB_OBJECTID_REGEX, {
    message: "Notification ID is invalid",
  }),
});
