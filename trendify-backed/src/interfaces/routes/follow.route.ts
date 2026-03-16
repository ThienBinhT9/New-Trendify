import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import followController from "@/infrastructure/injection/follow.injection";

import { FOLLOW_ROUTES } from "@/shared/constants/router.constant";

const route = Router();

route.use(authMiddleware());

route.post(FOLLOW_ROUTES.FOLLOW_USER, followController.follow);

route.delete(FOLLOW_ROUTES.UNFOLLOW_USER, followController.unfollow);

route.delete(FOLLOW_ROUTES.REMOVE_FOLLOW_USER, followController.removefollow);

route.delete(FOLLOW_ROUTES.CANCEL_REQUEST, followController.cancelFollowRequest);

route.post(FOLLOW_ROUTES.ACCEPT_REQUEST, followController.acceptFollowRequest);

route.delete(FOLLOW_ROUTES.REJECT_REQUEST, followController.rejectFollowRequest);

export default route;
