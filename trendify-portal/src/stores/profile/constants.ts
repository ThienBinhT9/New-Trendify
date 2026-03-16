import { IApiResponse } from "@/interfaces/api.interface";
import { IListParams } from "@/interfaces/common.interface";
import { EAccountType, EUserGender, IPictureUrl, IUser } from "@/interfaces/user.interface";

export enum EProfileActions {
  MY_PROFILE = "MY_PROFILE",
  USER_PROFILE = "USER_PROFILE",
  LIST_BLOCKED = "LIST_BLOCKED",
  LIST_FOLLOWING = "LIST_FOLLOWING",
  LIST_FOLLOWERS = "LIST_FOLLOWERS",
}

export const PROFILE_ENPOINT = {
  MY_PROFILE: "/users/me",
  USER_PROFILE: (userId: string) => `/users/${userId}`,
  LIST_BLOCKED: "/users/me/blocked",
  LIST_FOLLOWING: (userId: string) => `/users/${userId}/following`,
  LIST_FOLLOWERS: (userId: string) => `/users/${userId}/followers`,
};

export interface IProfileState {
  profile: IUserProfile | null;
  isOwnProfile: boolean;
  errorStatus: number | null;
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
  viewerContext: IUserViewContext;
}

export interface IUserRelationship {
  id: string;
  username?: string;
  firstName: string;
  lastName?: string;
  profilePicture?: IPictureUrl;
  viewerContext: IUserViewContext;
}

export interface IUserViewContext {
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
