import { IApiResponse } from "@/interfaces/api.interface";
import { IUserRelationship, IUserViewContext } from "../profile/constants";

export enum EFollowActions {
  FOLLOW = "follow/follow",
  UNFOLLOW = "follow/unfollow",
  REMOVE_FOLLOWER = "follow/remove_follower",
  ACCEPT_FOLLOW_REQUEST = "follow/accept_follow_request",
  REJECT_FOLLOW_REQUEST = "follow/reject_follow_request",
  CANCEL_FOLLOW_REQUEST = "follow/cancel_follow_request",
  BLOCK = "follow/block",
  UNBLOCK = "follow/unblock",
}

export const FOLLOW_ENPOINT = {
  FOLLOW: (userId: string) => `/follow/${userId}`,
  UNFOLLOW: (userId: string) => `/follow/${userId}`,
  REMOVE_FOLLOWER: (userId: string) => `/follow/followers/${userId}`,
  CANCEL_FOLLOW_REQUEST: (userId: string) => `/follow/follow-requests/${userId}`,
  ACCEPT_FOLLOW_REQUEST: (requesterId: string) => `/follow/follow-requests/${requesterId}/accept`,
  REJECT_FOLLOW_REQUEST: (requesterId: string) => `/follow/follow-requests/${requesterId}/reject`,
  BLOCK: (userId: string) => `/users/${userId}/block`,
  UNBLOCK: (userId: string) => `/users/${userId}/block`,
};

// ========== Interfaces ==========

// ========== Requests ==========
export interface IFollowResponse extends IApiResponse {
  data: {
    viewContext: Partial<IUserViewContext>;
  };
}

export interface IUnFollowResponse extends IApiResponse {
  data: {
    viewContext: Partial<IUserViewContext>;
  };
}

export interface IRemoveFollowerResponse extends IApiResponse {
  data: {
    viewContext: Partial<IUserViewContext>;
  };
}

export interface IAcceptFollowResponse extends IApiResponse {
  data: {
    viewContext: Partial<IUserViewContext>;
  };
}

export interface IRejectFollowResponse extends IApiResponse {
  data: {
    viewContext: Partial<IUserViewContext>;
  };
}

export interface ICancelFollowResponse extends IApiResponse {
  data: {
    viewContext: Partial<IUserViewContext>;
  };
}

export interface IBlockResponse extends IApiResponse {
  data: Record<string, never>;
}

export interface IUnblockResponse extends IApiResponse {
  data: Record<string, never>;
}

// ========== State ==========
export interface IFollowState {
  followers: {
    users: IUserRelationship[];
    searchUsers: IUserRelationship[];
    cursor?: string | null;
    page?: number | null;
    hasNext: boolean;
  };
  following: {
    users: IUserRelationship[];
    searchUsers: IUserRelationship[];
    cursor?: string | null;
    page?: number | null;
    hasNext: boolean;
  };
  blocked: {
    users: IUserRelationship[];
    cursor?: string | null;
    hasNext: boolean;
  };
}
