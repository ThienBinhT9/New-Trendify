import { IApiResponse } from "@/interfaces/api.interface";
import { IListParams } from "@/interfaces/common.interface";
import { IPost } from "@/interfaces/post.interface";
import { EAccountType, EUserGender, IPictureUrl, IUser } from "@/interfaces/user.interface";

export enum EPostActions {
  CREATE_POST = "CREATE_POST",
  DELETE_POST = "DELETE_POST",
  GET_POST_DETAIL = "GET_POST_DETAIL",

  LIKE_POST = "LIKE_POST",
  UNLIKE_POST = "UNLIKE_POST",
  COMMENT_POST = "COMMENT_POST",

  GET_USER_POSTS = "GET_USER_POSTS",
  GET_FOLLOWING_POSTS = "GET_FOLLOWING_POSTS",
  GET_HOME_FEED = "GET_HOME_FEED",
}

export const POST_ENDPOINT = {
  CREATE_POST: "/posts",
  DELETE_POST: (postId: string) => `/posts/${postId}`,
  GET_POST_DETAIL: (postId: string) => `/posts/${postId}`,

  LIKE_POST: (postId: string) => `/posts/${postId}/like`,
  UNLIKE_POST: (postId: string) => `/posts/${postId}/like`,
  COMMENT_POST: (postId: string) => `/posts/${postId}/comment`,

  GET_USER_POSTS: (userId: string) => `/users/${userId}/posts`,
  GET_FOLLOWING_POSTS: "/posts/following",
};

export interface IPostState {
  userPosts: {
    [userId: string]: { posts: IPost[] };
  };
}

export interface IUserProfile {
  id: string;
  postCount: number;
  followerCount: number;
  followingCount: number;

  username: string;
  firstName: string;
  lastName?: string;
  about?: string;
  gender?: EUserGender;
  dateOfBirth?: string;
  coverPicture?: IPictureUrl;
  profilePicture?: IPictureUrl;
  isVerified: boolean;
  accountType: EAccountType;
  createdAt: Date;
  viewerContext: IPostViewContext;
}

export interface IPostViewContext {
  isSelf: boolean;
  isRequested: boolean;
  isFollowing: boolean;
  isFollowedBy: boolean;
  isRequestedByThem: boolean;
  canFollow: boolean;
}

//============= REQUEST =============
export interface IListRelationshipRequest extends IListParams {
  userId: string;
}

export interface IUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  about?: string;
  gender?: EUserGender;
  dateOfBirth?: string;
  coverPicture?: string;
  profilePicture?: string;
}

//============= RESPONSE =============
export interface IUserProfileResponse extends IApiResponse {
  data: IUserProfile;
}

export interface IUpdateProfileResponse extends IApiResponse {
  data: IUser;
}

export interface IUserRelationshipListResponse extends IApiResponse {
  data: {
    users: IUserRelationship[];
    cursor?: string | null;
    page?: number;
    hasNext: boolean;
  };
}
