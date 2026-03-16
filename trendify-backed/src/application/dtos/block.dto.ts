export interface BlockUserDTO {
  /** User performing the block */
  blockerId: string;
  /** User being blocked */
  blockedId: string;
  /** Optional reason for blocking */
  reason?: string;
}

export interface UnblockUserDTO {
  /** User performing the unblock */
  blockerId: string;
  /** User being unblocked */
  blockedId: string;
}

export interface GetBlockedListDTO {
  userId: string;
  /** Pagination limit */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
}

export interface CheckBlockStatusDTO {
  /** User checking the block status */
  userId: string;
  /** Target user to check */
  targetUserId: string;
}
