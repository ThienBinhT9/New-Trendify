import { IApiResponse } from "@/interfaces/api.interface";
import { EVisibility } from "@/interfaces/common.interface";
import { IPost, IPostLocation, IPostMention } from "@/interfaces/post.interface";
import { IComment, ICommentMention } from "@/interfaces/comment.interface";

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
  GET_SAVED_POSTS = "GET_SAVED_POSTS",
  GET_DRAFT_POSTS = "GET_DRAFT_POSTS",
}

export const POST_ENDPOINT = {
  CREATE_POST: "/posts",
  DELETE_POST: (postId: string) => `/posts/${postId}`,
  GET_POST_DETAIL: (postId: string) => `/posts/${postId}`,

  LIKE_POST: (postId: string) => `/posts/${postId}/like`,
  UNLIKE_POST: (postId: string) => `/posts/${postId}/like`,

  SAVE_POST: (postId: string) => `/posts/${postId}/save`,
  UNSAVE_POST: (postId: string) => `/posts/${postId}/save`,

  COMMENT_POST: (postId: string) => `/posts/${postId}/comments`,
  DELETE_COMMENT: (postId: string, commentId: string) => `/posts/${postId}/comments/${commentId}`,

  GET_USER_POSTS: (userId: string) => `/users/${userId}/posts`,
  GET_FOLLOWING_POSTS: "/posts/following",
  GET_SAVED_POSTS: "/posts/saved",
  GET_DRAFT_POSTS: "/posts/drafts",
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
  savedPosts: {
    posts: IPost[];
    cursor?: string | null;
    hasNext: boolean;
  };
  draftPosts: {
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
  allowLike?: boolean;
  allowSave?: boolean;
  allowComment?: boolean;
  allowShare?: boolean;
  isDraft?: boolean;
}

export interface ICreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string;
  mentions?: ICommentMention[];
}

//============= RESPONSE =============
export interface ICreatePostResponse extends IApiResponse {
  data: IPost;
}

export interface IDeletePostResponse extends IApiResponse {
  message: string;
}

export interface IPostDetailResponse extends IApiResponse {
  data: IPost;
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

export interface ISavedPostsResponse extends IApiResponse {
  data: {
    posts: IPost[];
    nextCursor: string;
  };
}

export interface IDraftPostsResponse extends IApiResponse {
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

export interface ICreateCommentResponse extends IApiResponse {
  data: {
    comment: IComment;
  };
}
