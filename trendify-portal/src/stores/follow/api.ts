import {
  FOLLOW_ENPOINT,
  IFollowResponse,
  IUnFollowResponse,
  IAcceptFollowResponse,
  ICancelFollowResponse,
  IRejectFollowResponse,
  IRemoveFollowerResponse,
  IBlockResponse,
  IUnblockResponse,
} from "./constants";
import apiClient from "@/services/api-clients";

export const follow = async (userId: string) => {
  return apiClient.post<IFollowResponse>(FOLLOW_ENPOINT.FOLLOW(userId));
};

export const unFollow = async (userId: string) => {
  return apiClient.delete<IUnFollowResponse>(FOLLOW_ENPOINT.UNFOLLOW(userId));
};

export const removeFollow = async (userId: string) => {
  return apiClient.delete<IRemoveFollowerResponse>(FOLLOW_ENPOINT.REMOVE_FOLLOWER(userId));
};

export const cancelFollowRequest = async (userId: string) => {
  return apiClient.delete<ICancelFollowResponse>(FOLLOW_ENPOINT.CANCEL_FOLLOW_REQUEST(userId));
};

export const acceptFollowRequest = async (requesterId: string) => {
  return apiClient.post<IAcceptFollowResponse>(FOLLOW_ENPOINT.ACCEPT_FOLLOW_REQUEST(requesterId));
};

export const rejectFollowRequest = async (requesterId: string) => {
  return apiClient.delete<IRejectFollowResponse>(FOLLOW_ENPOINT.REJECT_FOLLOW_REQUEST(requesterId));
};

export const blockUser = async (userId: string) => {
  return apiClient.post<IBlockResponse>(FOLLOW_ENPOINT.BLOCK(userId));
};

export const unblockUser = async (userId: string) => {
  return apiClient.delete<IUnblockResponse>(FOLLOW_ENPOINT.UNBLOCK(userId));
};
