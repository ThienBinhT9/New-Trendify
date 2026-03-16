import {
  PROFILE_ENPOINT,
  IUpdateProfileRequest,
  IUserProfileResponse,
  IUserRelationshipListResponse,
  IUpdateProfileResponse,
} from "./constants";
import { IListParams } from "@/interfaces/common.interface";

import apiClient from "@/services/api-clients";

export const userProfile = async (userId: string) => {
  return apiClient.get<IUserProfileResponse>(PROFILE_ENPOINT.USER_PROFILE(userId));
};

export const updateProfile = async (body: IUpdateProfileRequest) => {
  return apiClient.patch<IUpdateProfileResponse>(PROFILE_ENPOINT.MY_PROFILE, body);
};

export const listFollowing = async (userId: string, params?: IListParams) => {
  return apiClient.get<IUserRelationshipListResponse>(PROFILE_ENPOINT.LIST_FOLLOWING(userId), {
    params,
  });
};

export const listFollowers = async (userId: string, params?: IListParams) => {
  return apiClient.get<IUserRelationshipListResponse>(PROFILE_ENPOINT.LIST_FOLLOWERS(userId), {
    params,
  });
};

export const listBlocked = async (params?: IListParams) => {
  return apiClient.get<IUserRelationshipListResponse>(PROFILE_ENPOINT.LIST_BLOCKED, {
    params,
  });
};
