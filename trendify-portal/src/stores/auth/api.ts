import { IApiResponse } from "@/interfaces/api.interface";
import {
  AUTH_ENPOINT,
  ISignupStartRequest,
  ISignupVerifyRequest,
  ISigninRequest,
  ISignInResponse,
  ISignupCompleteRequest,
  ISignUpVerifyResponse,
  ISignUpCompleteResponse,
  ISignOutRequest,
  ISignUpStartResponse,
  IForgotPasswordRequest,
  IResetPasswordRequest,
  IRefreshTokenResponse,
} from "./constants";
import apiClient from "@/services/api-clients";

export const signin = async (body: ISigninRequest) => {
  return apiClient.post<ISignInResponse>(AUTH_ENPOINT.SIGN_IN, body);
};

export const signout = async (body: ISignOutRequest) => {
  return apiClient.post<IApiResponse>(AUTH_ENPOINT.SIGN_OUT, body);
};

export const signupStart = async (body: ISignupStartRequest) => {
  return apiClient.post<ISignUpStartResponse>(AUTH_ENPOINT.SIGN_UP_START, body);
};

export const signupVerify = async (body: ISignupVerifyRequest) => {
  return apiClient.post<ISignUpVerifyResponse>(AUTH_ENPOINT.SIGN_UP_VERIFY, body);
};

export const signupComplete = async (body: ISignupCompleteRequest) => {
  return apiClient.post<ISignUpCompleteResponse>(AUTH_ENPOINT.SIGN_UP_COMPLETE, body);
};

export const refreshToken = async () => {
  return apiClient.post<IRefreshTokenResponse>(AUTH_ENPOINT.REFRESH_TOKEN);
};

export const forgotPassword = async (body: IForgotPasswordRequest) => {
  return apiClient.post<IApiResponse>(AUTH_ENPOINT.FORGOT_PASSWORD, body);
};

export const resetPassword = async (body: IResetPasswordRequest) => {
  return apiClient.post<IApiResponse>(AUTH_ENPOINT.RESET_PASSWORD, body);
};
