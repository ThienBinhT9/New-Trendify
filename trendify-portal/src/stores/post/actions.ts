import { createAsyncThunk } from "@reduxjs/toolkit";
import { EProfileActions, IListRelationshipRequest, IUpdateProfileRequest } from "./constants";

import * as api from "./api";
import { IListParams } from "@/interfaces/common.interface";

export const userProfileAction = createAsyncThunk(
  EProfileActions.USER_PROFILE,
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.userProfile(userId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const updateProfileAction = createAsyncThunk(
  EProfileActions.MY_PROFILE,
  async (body: IUpdateProfileRequest, { rejectWithValue }) => {
    try {
      const response = await api.updateProfile(body);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const listFollowingAction = createAsyncThunk(
  EProfileActions.LIST_FOLLOWING,
  async (payload: IListRelationshipRequest, { rejectWithValue }) => {
    try {
      const { userId, ...params } = payload;
      const response = await api.listFollowing(userId, params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const listFollowersAction = createAsyncThunk(
  EProfileActions.LIST_FOLLOWERS,
  async (payload: IListRelationshipRequest, { rejectWithValue }) => {
    try {
      const { userId, ...params } = payload;
      const response = await api.listFollowers(userId, params);
      console.log({ response });

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const listBlockedAction = createAsyncThunk(
  EProfileActions.LIST_BLOCKED,
  async (params: IListParams, { rejectWithValue }) => {
    try {
      const response = await api.listBlocked(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
