import { Router } from "express";

import userController from "@/infrastructure/injection/user.injection";
import followController from "@/infrastructure/injection/follow.injection";
import blockController from "@/infrastructure/injection/block.injection";
import postController from "@/infrastructure/injection/post.injection";

import { authMiddleware } from "@/interfaces/middlewares/auth.middleware";
import { validate, validateParams, validateQuery } from "../middlewares/validate.middleware";

import * as schema from "../validators/user.validator";
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

route.get(USER_ROUTES.FOLLOWERS, followController.getFollowers);

route.get(USER_ROUTES.FOLLOWING, followController.getFollowing);

route.get(USER_ROUTES.BLOCKED, blockController.getBlockedList);

route.get(USER_ROUTES.POSTS, postController.getUserPosts);

export default route;
