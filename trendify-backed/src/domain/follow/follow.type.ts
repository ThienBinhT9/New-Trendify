/**
 * Follow Status Enum
 * - PENDING: Follow request sent, waiting for approval
 * - ACCEPTED: Follow request accepted / Direct follow (public profile)
 * - REJECTED: Follow request rejected by target user
 * - CANCELLED: Follow request cancelled by requester
 */
export enum EFollowStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
}

export interface IFollowProps {
  followerId: string;
  followingId: string;
  status: EFollowStatus;

  createdAt: Date;
  updatedAt: Date;
}
