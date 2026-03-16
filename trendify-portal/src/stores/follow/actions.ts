import { createAsyncThunk } from "@reduxjs/toolkit";
import { EFollowActions } from "./constants";

import * as api from "./api";

export const followAction = createAsyncThunk(
  EFollowActions.FOLLOW,
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.follow(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const unfollowAction = createAsyncThunk(
  EFollowActions.UNFOLLOW,
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.unFollow(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const removeFollowerAction = createAsyncThunk(
  EFollowActions.REMOVE_FOLLOWER,
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.removeFollow(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const cancelFollowRequestAction = createAsyncThunk(
  EFollowActions.CANCEL_FOLLOW_REQUEST,
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.cancelFollowRequest(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const rejectFollowRequestAction = createAsyncThunk(
  EFollowActions.REJECT_FOLLOW_REQUEST,
  async (requesterId: string, { rejectWithValue }) => {
    try {
      const response = await api.rejectFollowRequest(requesterId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const acceptFollowRequestAction = createAsyncThunk(
  EFollowActions.ACCEPT_FOLLOW_REQUEST,
  async (requesterId: string, { rejectWithValue }) => {
    try {
      const response = await api.acceptFollowRequest(requesterId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const blockAction = createAsyncThunk(
  EFollowActions.BLOCK,
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.blockUser(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const unblockAction = createAsyncThunk(
  EFollowActions.UNBLOCK,
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await api.unblockUser(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
