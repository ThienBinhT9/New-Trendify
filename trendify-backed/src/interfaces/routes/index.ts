import { Application } from "express";

import authRoute from "./auth.route";
import userRoute from "./user.route";
import followRoute from "./follow.route";
import mediaRoute from "./media.route";
import postRoute from "./post.route";

import {
  AUTH_ROUTES,
  USER_ROUTES,
  FOLLOW_ROUTES,
  MEDIA_ROUTES,
  POST_ROUTES,
} from "@/shared/constants/router.constant";

const routes = (app: Application) => {
  app.use(AUTH_ROUTES.BASE, authRoute);
  app.use(USER_ROUTES.BASE, userRoute);
  app.use(FOLLOW_ROUTES.BASE, followRoute);
  app.use(MEDIA_ROUTES.BASE, mediaRoute);
  app.use(POST_ROUTES.BASE, postRoute);
};

export default routes;
