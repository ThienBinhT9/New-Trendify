import { createAsyncThunk } from "@reduxjs/toolkit";
import { EPostActions, ICreateCommentRequest, ICreatePostRequest, IUpdatePostRequest } from "./constants";

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

export const updatePostAction = createAsyncThunk(
  EPostActions.UPDATE_POST,
  async (body: IUpdatePostRequest, { rejectWithValue }) => {
    try {
      const response = await api.updatePost(body);
      return response.data.data;
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

export const getPostCommentsAction = createAsyncThunk(
  EPostActions.GET_POST_COMMENTS,
  async (payload: { postId: string; params?: IListParams }, { rejectWithValue }) => {
    try {
      const { postId, params } = payload;
      const response = await api.listPostComments(postId, params);
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

export const getSavedPostsAction = createAsyncThunk(
  EPostActions.GET_SAVED_POSTS,
  async (payload: { params?: IListParams }, { rejectWithValue }) => {
    try {
      const { params } = payload;
      const response = await api.listSavedPosts(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getDraftPostsAction = createAsyncThunk(
  EPostActions.GET_DRAFT_POSTS,
  async (payload: { params?: IListParams }, { rejectWithValue }) => {
    try {
      const { params } = payload;
      const response = await api.listDraftPosts(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getHashtagPostsAction = createAsyncThunk(
  EPostActions.GET_HASHTAG_POSTS,
  async (payload: { tag: string; params?: IListParams }, { rejectWithValue }) => {
    try {
      const { tag, params } = payload;
      const response = await api.listHashtagPosts(tag, params);
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

export const commentPostAction = createAsyncThunk(
  EPostActions.COMMENT_POST,
  async (payload: ICreateCommentRequest, { rejectWithValue }) => {
    try {
      const response = await api.createComment(payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const deleteCommentAction = createAsyncThunk(
  EPostActions.DELETE_COMMENT,
  async (payload: { postId: string; commentId: string }, { rejectWithValue }) => {
    try {
      const { postId, commentId } = payload;
      const response = await api.deleteComment(postId, commentId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getCommentRepliesAction = createAsyncThunk(
  EPostActions.GET_COMMENT_REPLIES,
  async (
    payload: { postId: string; commentId: string; params?: IListParams },
    { rejectWithValue },
  ) => {
    try {
      const { postId, commentId, params } = payload;
      const response = await api.listCommentReplies(postId, commentId, params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const likeCommentAction = createAsyncThunk(
  EPostActions.LIKE_COMMENT,
  async (payload: { postId: string; commentId: string }, { rejectWithValue }) => {
    try {
      const { postId, commentId } = payload;
      const response = await api.likeComment(postId, commentId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const unlikeCommentAction = createAsyncThunk(
  EPostActions.UNLIKE_COMMENT,
  async (payload: { postId: string; commentId: string }, { rejectWithValue }) => {
    try {
      const { postId, commentId } = payload;
      const response = await api.unlikeComment(postId, commentId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
