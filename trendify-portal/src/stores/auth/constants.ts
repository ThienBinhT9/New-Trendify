import { IApiResponse } from "@/interfaces/api.interface";
import { ESignupStep } from "@/interfaces/auth.interface";
import { TokenStorage } from "@/interfaces/common.interface";
import { IUserSettings } from "@/interfaces/setting.interface";
import { IUser } from "@/interfaces/user.interface";

export enum EAuthActions {
  SIGN_IN = "auth/sign-in",
  SIGN_OUT = "auth/sign-out",
  SIGN_UP_START = "auth/sign-up",
  SIGN_UP_VERIFY = "auth/sign-up/verify",
  SIGN_UP_COMPLETE = "auth/sign-up/complete",
  REFRESH_TOKEN = "auth/refresh",
  FORGOT_PASSWORD = "auth/password/forgot",
  RESET_PASSWORD = "auth/password/reset",
}

export const AUTH_ENPOINT = {
  SIGN_IN: "/auth/sign-in",
  SIGN_OUT: "/auth/sign-out",
  SIGN_UP_START: "/auth/sign-up",
  SIGN_UP_VERIFY: "/auth/sign-up/verify",
  SIGN_UP_COMPLETE: "/auth/sign-up/complete",
  REFRESH_TOKEN: "/auth/refresh",
  FORGOT_PASSWORD: "/auth/password/forgot",
  RESET_PASSWORD: "/auth/password/reset",
};

// ========== Requests ==========
export interface ISigninRequest {
  email: string;
  password: string;
}

export interface ISignOutRequest {
  logoutAll?: boolean;
}

export interface ISignupStartRequest {
  email: string;
}

export interface ISignupVerifyRequest {
  token: string;
}

export interface ISignupCompleteRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface IForgotPasswordRequest {
  email: string;
}

export interface IResetPasswordRequest {
  token: string;
  newPassword: string;
}

// ========== Responses ==========
export interface ISignUpStartResponse extends IApiResponse {
  data: {
    nextStep: ESignupStep;
  };
}

export interface ISignUpVerifyResponse extends IApiResponse {
  data: {
    nextStep: ESignupStep;
  };
}

export interface ISignUpCompleteResponse extends IApiResponse {
  data: {
    user: IUser;
    settings: IUserSettings;
    tokens: TokenStorage;
  };
}

export interface ISignInResponse extends IApiResponse {
  data: {
    user: IUser;
    settings: IUserSettings;
    tokens: TokenStorage;
  };
}

export interface IRefreshTokenResponse extends IApiResponse {
  data: TokenStorage;
}

// ========== State ==========
export interface IAuthState {
  user: IUser | null;
  isAuthenticated: boolean;
}
