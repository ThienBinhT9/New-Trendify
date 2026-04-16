import { Application } from "express";

import authRoute from "./auth.route";
import userRoute from "./user.route";
import followRoute from "./follow.route";
import mediaRoute from "./media.route";
import postRoute from "./post.route";
import searchRoute from "./search.route";
import chatRoute from "./chat.route";
import aiRoute from "./ai.route";

import {
  AUTH_ROUTES,
  USER_ROUTES,
  FOLLOW_ROUTES,
  MEDIA_ROUTES,
  POST_ROUTES,
  SEARCH_ROUTES,
  CHAT_ROUTES,
  AI_ROUTES,
} from "@/shared/constants/router.constant";

const routes = (app: Application) => {
  app.use(AUTH_ROUTES.BASE, authRoute);
  app.use(USER_ROUTES.BASE, userRoute);
  app.use(FOLLOW_ROUTES.BASE, followRoute);
  app.use(MEDIA_ROUTES.BASE, mediaRoute);
  app.use(POST_ROUTES.BASE, postRoute);
  app.use(SEARCH_ROUTES.BASE, searchRoute);
  app.use(CHAT_ROUTES.BASE, chatRoute);
  app.use(AI_ROUTES.BASE, aiRoute);
};

export default routes;

