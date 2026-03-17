import {
  POST_ENDPOINT,
  ICreatePostRequest,
  ICreatePostResponse,
  IDeletePostResponse,
  IPostDetailResponse,
  IUserPostsResponse,
  IFollowingPostsResponse,
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
