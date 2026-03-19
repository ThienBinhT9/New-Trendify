import {
  POST_ENDPOINT,
  ICreatePostRequest,
  ICreatePostResponse,
  IDeletePostResponse,
  IPostDetailResponse,
  IUserPostsResponse,
  IFollowingPostsResponse,
  ILikePostResponse,
  ISavePostResponse,
} from "./constants";
import { IListParams } from "@/interfaces/common.interface";

import apiClient from "@/services/api-clients";

export const createPost = async (body: ICreatePostRequest) => {
  return apiClient.post<ICreatePostResponse>(POST_ENDPOINT.CREATE_POST, body);
};

export const deletePost = async (postId: string) => {
  return apiClient.delete<IDeletePostResponse>(POST_ENDPOINT.DELETE_POST(postId));
};

export const getPost = async (postId: string) => {
  return apiClient.get<IPostDetailResponse>(POST_ENDPOINT.GET_POST_DETAIL(postId));
};

export const listUserPosts = async (userId: string, params?: IListParams) => {
  return apiClient.get<IUserPostsResponse>(POST_ENDPOINT.GET_USER_POSTS(userId), {
    params,
  });
};

export const listFollowingPosts = async (params?: IListParams) => {
  return apiClient.get<IFollowingPostsResponse>(POST_ENDPOINT.GET_FOLLOWING_POSTS, {
    params,
  });
};

export const likePost = async (postId: string) => {
  return apiClient.get<ILikePostResponse>(POST_ENDPOINT.LIKE_POST(postId));
};

export const unlikePost = async (postId: string) => {
  return apiClient.get<ILikePostResponse>(POST_ENDPOINT.UNLIKE_POST(postId));
};

export const savePost = async (postId: string) => {
  return apiClient.get<ISavePostResponse>(POST_ENDPOINT.SAVE_POST(postId));
};

export const unsavePost = async (postId: string) => {
  return apiClient.get<ISavePostResponse>(POST_ENDPOINT.UNSAVE_POST(postId));
};
