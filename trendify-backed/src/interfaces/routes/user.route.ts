import { Router } from "express";

import userController from "@/infrastructure/injection/user.injection";
import followController from "@/infrastructure/injection/follow.injection";
import blockController from "@/infrastructure/injection/block.injection";
import postController from "@/infrastructure/injection/post.injection";
import notificationController from "@/infrastructure/injection/notification.injection";
import presenceController from "@/infrastructure/injection/presence.injection";

import { authMiddleware } from "@/interfaces/middlewares/auth.middleware";
import { validate, validateParams, validateQuery } from "../middlewares/validate.middleware";

import * as schema from "../validators/user.validator";
import * as notificationSchema from "../validators/notification.validator";
import * as presenceSchema from "../validators/presence.validator";
import { USER_ROUTES } from "@/shared/constants/router.constant";

const route = Router();

route.use(authMiddleware());

//user
route.get(
  USER_ROUTES.PROFILE,
  validateParams(schema.getUserProfileSchema),
  userController.userProfile,
);

route.patch(USER_ROUTES.ME, validate(schema.updateProfileSchema), userController.updateProfile);

route.get(USER_ROUTES.SETTINGS, userController.getSettings);

route.patch(
  USER_ROUTES.SETTINGS,
  validate(schema.updateSettingsSchema),
  userController.updateSettings,
);

route.get(
  USER_ROUTES.NOTIFICATIONS,
  validateQuery(notificationSchema.getNotificationsQuerySchema),
  notificationController.getNotifications,
);

route.get(USER_ROUTES.NOTIFICATIONS_UNREAD_COUNT, notificationController.getUnreadCount);

route.patch(
  USER_ROUTES.NOTIFICATION_READ,
  validateParams(notificationSchema.notificationIdParamSchema),
  notificationController.markAsRead,
);

route.patch(USER_ROUTES.NOTIFICATIONS_READ_ALL, notificationController.markAllAsRead);

route.get(USER_ROUTES.FOLLOWERS, followController.getFollowers);

route.get(USER_ROUTES.FOLLOWING, followController.getFollowing);

route.get(USER_ROUTES.BLOCKED, blockController.getBlockedList);

route.post("/:userId/block", blockController.block);

route.delete("/:userId/block", blockController.unblock);

route.get("/:userId/block/status", blockController.checkBlockStatus);

route.get(USER_ROUTES.POSTS, postController.getUserPosts);

// ── Presence ──
route.get(
  USER_ROUTES.PRESENCE,
  validateParams(presenceSchema.getUserPresenceSchema),
  presenceController.getUserPresence,
);

route.post(
  USER_ROUTES.PRESENCE_BATCH,
  validate(presenceSchema.batchPresenceSchema),
  presenceController.getBatchPresence,
);

export default route;
