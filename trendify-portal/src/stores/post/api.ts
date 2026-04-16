import {
  POST_ENDPOINT,
  ICreatePostRequest,
  ICreatePostResponse,
  IDeletePostResponse,
  IUpdatePostRequest,
  IUpdatePostResponse,
  IPostDetailResponse,
  IUserPostsResponse,
  IFollowingPostsResponse,
  ISavedPostsResponse,
  IDraftPostsResponse,
  ILikePostResponse,
  IPostLikesResponse,
  ISavePostResponse,
  ICreateCommentRequest,
  ICreateCommentResponse,
  IPostCommentsResponse,
  IDeleteCommentResponse,
  ICommentRepliesResponse,
  ILikeCommentResponse,
  IHashtagPostsResponse,
} from "./constants";
import { IListParams } from "@/interfaces/common.interface";

import apiClient from "@/services/api-clients";

export const createPost = async (body: ICreatePostRequest) => {
  return apiClient.post<ICreatePostResponse>(POST_ENDPOINT.CREATE_POST, body);
};

export const deletePost = async (postId: string) => {
  return apiClient.delete<IDeletePostResponse>(POST_ENDPOINT.DELETE_POST(postId));
};

export const updatePost = async ({ postId, ...body }: IUpdatePostRequest) => {
  return apiClient.patch<IUpdatePostResponse>(POST_ENDPOINT.UPDATE_POST(postId), body);
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

export const listSavedPosts = async (params?: IListParams) => {
  return apiClient.get<ISavedPostsResponse>(POST_ENDPOINT.GET_SAVED_POSTS, {
    params,
  });
};

export const listDraftPosts = async (params?: IListParams) => {
  return apiClient.get<IDraftPostsResponse>(POST_ENDPOINT.GET_DRAFT_POSTS, {
    params,
  });
};

export const likePost = async (postId: string) => {
  return apiClient.post<ILikePostResponse>(POST_ENDPOINT.LIKE_POST(postId));
};

export const listPostLikes = async (postId: string, params?: IListParams) => {
  return apiClient.get<IPostLikesResponse>(POST_ENDPOINT.GET_POST_LIKES(postId), {
    params,
  });
};

export const unlikePost = async (postId: string) => {
  return apiClient.delete<ILikePostResponse>(POST_ENDPOINT.UNLIKE_POST(postId));
};

export const savePost = async (postId: string) => {
  return apiClient.post<ISavePostResponse>(POST_ENDPOINT.SAVE_POST(postId));
};

export const unsavePost = async (postId: string) => {
  return apiClient.delete<ISavePostResponse>(POST_ENDPOINT.UNSAVE_POST(postId));
};

export const createComment = async (body: ICreateCommentRequest) => {
  const { postId: _postId, ...requestBody } = body;
  return apiClient.post<ICreateCommentResponse>(POST_ENDPOINT.COMMENT_POST(_postId), requestBody);
};

export const listPostComments = async (postId: string, params?: IListParams) => {
  return apiClient.get<IPostCommentsResponse>(POST_ENDPOINT.GET_POST_COMMENTS(postId), {
    params,
  });
};

export const deleteComment = async (postId: string, commentId: string) => {
  return apiClient.delete<IDeleteCommentResponse>(POST_ENDPOINT.DELETE_COMMENT(postId, commentId));
};

export const listCommentReplies = async (
  postId: string,
  commentId: string,
  params?: IListParams,
) => {
  return apiClient.get<ICommentRepliesResponse>(
    POST_ENDPOINT.GET_COMMENT_REPLIES(postId, commentId),
    {
      params,
    },
  );
};

export const likeComment = async (postId: string, commentId: string) => {
  return apiClient.post<ILikeCommentResponse>(POST_ENDPOINT.LIKE_COMMENT(postId, commentId));
};

export const unlikeComment = async (postId: string, commentId: string) => {
  return apiClient.delete<ILikeCommentResponse>(POST_ENDPOINT.UNLIKE_COMMENT(postId, commentId));
};

export const listHashtagPosts = async (tag: string, params?: IListParams) => {
  return apiClient.get<IHashtagPostsResponse>(POST_ENDPOINT.GET_HASHTAG_POSTS(tag), {
    params,
  });
};
