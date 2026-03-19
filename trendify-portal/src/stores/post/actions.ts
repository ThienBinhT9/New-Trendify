import { createAsyncThunk } from "@reduxjs/toolkit";
import { EPostActions, ICreatePostRequest } from "./constants";

import * as api from "./api";
import { IListParams } from "@/interfaces/common.interface";

export const createPostAction = createAsyncThunk(
  EPostActions.CREATE_POST,
  async (body: ICreatePostRequest, { rejectWithValue }) => {
    try {
      const response = await api.createPost(body);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const deletePostAction = createAsyncThunk(
  EPostActions.DELETE_POST,
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await api.deletePost(postId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getPostAction = createAsyncThunk(
  EPostActions.GET_POST_DETAIL,
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await api.getPost(postId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getUserPostsAction = createAsyncThunk(
  EPostActions.GET_USER_POSTS,
  async (payload: { userId: string; params?: IListParams }, { rejectWithValue }) => {
    try {
      const { userId, params } = payload;
      const response = await api.listUserPosts(userId, params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getFollowingPostsAction = createAsyncThunk(
  EPostActions.GET_FOLLOWING_POSTS,
  async (payload: { params?: IListParams }, { rejectWithValue }) => {
    try {
      const { params } = payload;
      const response = await api.listFollowingPosts(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const likePostAction = createAsyncThunk(
  EPostActions.LIKE_POST,
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await api.likePost(postId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const unlikePostAction = createAsyncThunk(
  EPostActions.UNLIKE_POST,
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await api.unlikePost(postId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const savePostAction = createAsyncThunk(
  EPostActions.SAVE_POST,
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await api.savePost(postId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const unsavePostAction = createAsyncThunk(
  EPostActions.UNSAVE_POST,
  async (postId: string, { rejectWithValue }) => {
    try {
      const response = await api.unsavePost(postId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
