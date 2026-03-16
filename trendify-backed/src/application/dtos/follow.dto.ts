export interface SendFollowRequestDTO {
  fromUserId: string;
  toUserId: string;
}

export interface AcceptFollowRequestDTO {
  fromUserId: string;
  toUserId: string;
}

export interface RejectFollowRequestDTO {
  fromUserId: string;
  toUserId: string;
}

export interface CancelFollowRequestDTO {
  fromUserId: string;
  toUserId: string;
}

export interface FollowUserDTO {
  fromUserId: string;
  toUserId: string;
}

export interface UnfollowUserDTO {
  fromUserId: string;
  toUserId: string;
}

export interface RemovefollowUserDTO {
  fromUserId: string;
  toUserId: string;
}

export interface GetFollowersDTO {
  userId: string; // profile owner
  viewerId: string; // người xem
  limit?: number;
  cursor?: string;
  page?: number;
  query?: string;
}

export interface GetFollowingDTO {
  userId: string; // profile owner
  viewerId: string; // người xem
  limit?: number;
  cursor?: string;
  page?: number;
  query?: string;
}
