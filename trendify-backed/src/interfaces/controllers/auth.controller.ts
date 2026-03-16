import { CookieOptions, Request, Response } from "express";

import {
  RefreshTokenUsecase,
  StartSignupUseCase,
  SignInUsecase,
  SignOutUsecase,
  CompleteSignUpUsecase,
  VerifySignupUsecase,
  ChangePasswordUsecase,
  ForgotPasswordUsecase,
  ResetPasswordUsecase,
} from "@/application/usecases/auth";

import { COOKIE_CONSANT } from "@/shared/constants";
import { getDeviceInfo } from "@/shared/utils";
import { SuccessResponse } from "@/shared/responses";

import appConfig from "@/config/app.config";
import { AUTH_ROUTES } from "@/shared/constants/router.constant";
import { SignupSettings } from "@/application/usecases/auth/auth.enum";

class AuthController {
  constructor(
    private readonly startSignUpUseCase: StartSignupUseCase,
    private readonly verifySignupUseCase: VerifySignupUsecase,
    private readonly completeSignUpUseCase: CompleteSignUpUsecase,
    private readonly signInUseCase: SignInUsecase,
    private readonly refreshTokenUsecase: RefreshTokenUsecase,
    private readonly signOutUseCase: SignOutUsecase,
    private readonly forgotPasswordUseCase: ForgotPasswordUsecase,
    private readonly resetPasswordUseCase: ResetPasswordUsecase,
    private readonly changePasswordUseCase: ChangePasswordUsecase,
  ) {}

  private setAuthCookies(
    response: Response,
    key: string,
    value: string,
    options: Partial<CookieOptions>,
  ) {
    const defaultOptions = {
      httpOnly: true,
      secure: appConfig.nodeEnv === "production",
      sameSite: "lax" as const,
      ...options,
    };

    response.cookie(key, value, defaultOptions);
  }

  private clearAuthCookies(response: Response, name: string, options: Partial<CookieOptions>) {
    const defaultOptions = {
      httpOnly: true,
      secure: appConfig.nodeEnv === "production",
      sameSite: "lax" as const,
      ...options,
    };

    response.clearCookie(name, defaultOptions);
  }

  startSignup = async (request: Request, response: Response) => {
    const { publicData } = await this.startSignUpUseCase.execute(request.body);

    const successResponse = new SuccessResponse({ data: publicData });
    response.status(200).json(successResponse);
  };

  verifySignup = async (request: Request, response: Response) => {
    const { publicData, cookieData } = await this.verifySignupUseCase.execute(request.body);

    this.setAuthCookies(response, COOKIE_CONSANT.SIGNUP_SESSION, cookieData.signupSession, {
      path: `${AUTH_ROUTES.BASE}${AUTH_ROUTES.SIGNUP_COMPLETE}`,
      maxAge: SignupSettings.ttlVerify,
    });

    const successResponse = new SuccessResponse({ data: publicData });
    response.status(200).json(successResponse);
  };

  completeSignup = async (request: Request, response: Response) => {
    const signupSession = request.cookies?.[COOKIE_CONSANT.SIGNUP_SESSION];
    const deviceInfo = getDeviceInfo(request);

    const { publicData, cookieData } = await this.completeSignUpUseCase.execute({
      ...request.body,
      ...deviceInfo,
      signupSession,
    });

    this.setAuthCookies(response, COOKIE_CONSANT.SESSION_ID, cookieData.sessionId, {
      path: `${AUTH_ROUTES.BASE}`,
      maxAge: appConfig.refreshTokenTtl,
    });
    this.setAuthCookies(response, COOKIE_CONSANT.REFRESH_TOKEN, cookieData.refreshTokenRaw, {
      path: `${AUTH_ROUTES.BASE}${AUTH_ROUTES.REFRESH}`,
      maxAge: appConfig.refreshTokenTtl,
    });

    this.clearAuthCookies(response, COOKIE_CONSANT.SIGNUP_SESSION, {
      path: `${AUTH_ROUTES.BASE}${AUTH_ROUTES.SIGNUP_COMPLETE}`,
    });

    const createdResponse = new SuccessResponse({ data: publicData, statusCode: 201 });
    response.status(201).json(createdResponse);
  };

  signIn = async (request: Request, response: Response) => {
    const deviceInfo = getDeviceInfo(request);

    const { publicData, cookieData } = await this.signInUseCase.execute({
      ...request.body,
      ...deviceInfo,
    });

    this.setAuthCookies(response, COOKIE_CONSANT.SESSION_ID, cookieData.sessionId, {
      path: `${AUTH_ROUTES.BASE}`,
      maxAge: appConfig.refreshTokenTtl,
    });
    this.setAuthCookies(response, COOKIE_CONSANT.REFRESH_TOKEN, cookieData.refreshTokenRaw, {
      path: `${AUTH_ROUTES.BASE}${AUTH_ROUTES.REFRESH}`,
      maxAge: appConfig.refreshTokenTtl,
    });

    const successResponse = new SuccessResponse({ data: publicData });
    response.status(200).json(successResponse);
  };

  signOut = async (request: Request, response: Response) => {
    const sessionId = request.cookies?.[COOKIE_CONSANT.SESSION_ID];
    const userId = response.locals?.auth?.userId;
    const logoutAll = request.body?.logoutAll;

    const result = await this.signOutUseCase.execute({ sessionId, userId, logoutAll });

    this.clearAuthCookies(response, COOKIE_CONSANT.SESSION_ID, {
      path: `${AUTH_ROUTES.BASE}${AUTH_ROUTES.REFRESH}`,
    });
    this.clearAuthCookies(response, COOKIE_CONSANT.REFRESH_TOKEN, {
      path: `${AUTH_ROUTES.BASE}${AUTH_ROUTES.REFRESH}`,
    });

    response.status(200).json(result);
  };

  refresh = async (request: Request, response: Response) => {
    const refreshToken = request.cookies?.[COOKIE_CONSANT.REFRESH_TOKEN];
    const sessionId = request.cookies?.[COOKIE_CONSANT.SESSION_ID];

    const { publicData, cookieData } = await this.refreshTokenUsecase.execute({
      sessionId,
      refreshToken,
    });

    this.setAuthCookies(response, COOKIE_CONSANT.REFRESH_TOKEN, cookieData.refreshTokenRaw, {
      path: `${AUTH_ROUTES.BASE}${AUTH_ROUTES.REFRESH}`,
      maxAge: appConfig.refreshTokenTtl,
    });

    const successResponse = new SuccessResponse({ data: publicData });
    response.status(200).json(successResponse);
  };

  forgotPassword = async (request: Request, response: Response) => {
    const result = await this.forgotPasswordUseCase.execute(request.body);

    response.status(200).json(result);
  };

  resetPassword = async (request: Request, response: Response) => {
    const result = await this.resetPasswordUseCase.execute(request.body);

    response.status(200).json(result);
  };

  changePassword = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const result = await this.changePasswordUseCase.execute({ ...request.body, userId });

    response.status(200).json(result);
  };
}

export default AuthController;
