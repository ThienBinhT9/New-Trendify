import { Router } from "express";

import authController from "@/infrastructure/injection/auth.injection";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";

import * as schema from "../validators/auth.validator";

import { AUTH_ROUTES } from "@/shared/constants/router.constant";

const route = Router();

route.post(AUTH_ROUTES.SIGNUP, validate(schema.startSignupSchema), authController.startSignup);
route.post(
  AUTH_ROUTES.SIGNUP_VERIFY,
  validate(schema.verifySignupSchema),
  authController.verifySignup,
);
route.post(
  AUTH_ROUTES.SIGNUP_COMPLETE,
  validate(schema.completeSignupSchema),
  authController.completeSignup,
);

route.post(AUTH_ROUTES.SIGNIN, validate(schema.signInSchema), authController.signIn);
route.post(AUTH_ROUTES.SIGNOUT, authMiddleware(), authController.signOut);

route.post(AUTH_ROUTES.REFRESH, authController.refresh);

route.post(
  AUTH_ROUTES.FORGOT_PASSWORD,
  validate(schema.forgotPasswordSchema),
  authController.forgotPassword,
);
route.post(
  AUTH_ROUTES.RESET_PASSWORD,
  validate(schema.resetPasswordSchema),
  authController.resetPassword,
);

route.post(
  AUTH_ROUTES.CHANGE_PASSWORD,
  validate(schema.changePasswordSchema),
  authMiddleware(),
  authController.changePassword,
);

export default route;
