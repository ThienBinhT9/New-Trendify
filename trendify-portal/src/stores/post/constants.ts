import { IApiResponse } from "@/interfaces/api.interface";
import { IComment } from "@/interfaces/comment.interface";
import { EVisibility } from "@/interfaces/common.interface";
import { IPost, IPostLocation, IPostMention } from "@/interfaces/post.interface";

export enum EPostActions {
  CREATE_POST = "CREATE_POST",
  DELETE_POST = "DELETE_POST",
  GET_POST_DETAIL = "GET_POST_DETAIL",

  LIKE_POST = "LIKE_POST",
  UNLIKE_POST = "UNLIKE_POST",

  SAVE_POST = "SAVE_POST",
  UNSAVE_POST = "UNSAVE_POST",

  COMMENT_POST = "COMMENT_POST",
  DELETE_COMMENT = "DELETE_COMMENT",

  GET_USER_POSTS = "GET_USER_POSTS",
  GET_FOLLOWING_POSTS = "GET_FOLLOWING_POSTS",
}

export const POST_ENDPOINT = {
  CREATE_POST: "/posts",
  DELETE_POST: (postId: string) => `/posts/${postId}`,
  GET_POST_DETAIL: (postId: string) => `/posts/${postId}`,

  LIKE_POST: (postId: string) => `/posts/${postId}/like`,
  UNLIKE_POST: (postId: string) => `/posts/${postId}/like`,

  SAVE_POST: (postId: string) => `/posts/${postId}/save`,
  UNSAVE_POST: (postId: string) => `/posts/${postId}/save`,

  COMMENT_POST: (postId: string) => `/posts/${postId}/comment`,
  DELETE_COMMENT: (postId: string, commentId: string) => `/posts/${postId}/comment/${commentId}`,

  GET_USER_POSTS: (userId: string) => `/users/${userId}/posts`,
  GET_FOLLOWING_POSTS: "/posts/following",
};

export interface IPostState {
  userPosts: {
    [userId: string]: { posts: IPost[]; cursor?: string | null; hasNext: boolean };
  };
  followingPosts: {
    posts: IPost[];
    cursor?: string | null;
    hasNext: boolean;
  };
}

//============= REQUEST =============
export interface ICreatePostRequest {
  authorId: string;
  content?: string;
  mediaIds?: string[];
  mentions?: IPostMention[];
  location?: IPostLocation;
  replyToId?: string;
  visibility?: EVisibility;
  isDraft?: boolean;
}

//============= RESPONSE =============
export interface ICreatePostResponse extends IApiResponse {
  data: {
    post: IPost;
  };
}

export interface IDeletePostResponse extends IApiResponse {
  message: string;
}

export interface IPostDetailResponse extends IApiResponse {
  data: {
    post: IPost;
  };
}

export interface IUserPostsResponse extends IApiResponse {
  data: {
    posts: IPost[];
    nextCursor: string;
  };
}

export interface IFollowingPostsResponse extends IApiResponse {
  data: {
    posts: IPost[];
    nextCursor: string;
  };
}

export interface ILikePostResponse extends IApiResponse {
  data: {
    isLiked: boolean;
  };
}
export interface ISavePostResponse extends IApiResponse {
  data: {
    isSaved: boolean;
  };
}
