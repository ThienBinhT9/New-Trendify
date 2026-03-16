import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  EAuthActions,
  IForgotPasswordRequest,
  IResetPasswordRequest,
  ISigninRequest,
  ISignOutRequest,
  ISignupCompleteRequest,
  ISignupStartRequest,
  ISignupVerifyRequest,
} from "./constants";

import * as api from "./api";
import { removeStorageTokens, setStorageTokens } from "@/utils/storage.util";

export const signinAction = createAsyncThunk(
  EAuthActions.SIGN_IN,
  async (body: ISigninRequest, { rejectWithValue }) => {
    try {
      const response = await api.signin(body);
      setStorageTokens(response.data.data.tokens);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const signoutAction = createAsyncThunk(
  EAuthActions.SIGN_OUT,
  async (body: ISignOutRequest, { rejectWithValue }) => {
    try {
      const response = await api.signout(body);
      removeStorageTokens();
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const signupStartAction = createAsyncThunk(
  EAuthActions.SIGN_UP_START,
  async (body: ISignupStartRequest, { rejectWithValue }) => {
    try {
      const response = await api.signupStart(body);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const signupVerifyAction = createAsyncThunk(
  EAuthActions.SIGN_UP_VERIFY,
  async (body: ISignupVerifyRequest, { rejectWithValue }) => {
    try {
      const response = await api.signupVerify(body);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const signupCompleteAction = createAsyncThunk(
  EAuthActions.SIGN_UP_COMPLETE,
  async (body: ISignupCompleteRequest, { rejectWithValue }) => {
    try {
      const response = await api.signupComplete(body);
      setStorageTokens(response.data.data.tokens);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const refreshTokenAction = createAsyncThunk(
  EAuthActions.REFRESH_TOKEN,
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.refreshToken();
      setStorageTokens(response.data.data);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const forgotPasswordAction = createAsyncThunk(
  EAuthActions.FORGOT_PASSWORD,
  async (body: IForgotPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await api.forgotPassword(body);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const resetPasswordAction = createAsyncThunk(
  EAuthActions.RESET_PASSWORD,
  async (body: IResetPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await api.resetPassword(body);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
