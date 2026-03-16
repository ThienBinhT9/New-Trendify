import { FollowEntity } from "./follow.entity";
import { EFollowStatus } from "./follow.type";

export interface IFollowRepository {
  /**
   * Create a new follow relationship
   */
  create(follow: FollowEntity): Promise<FollowEntity | null>;

  /**
   * Update an existing follow (e.g., accept, reject, cancel)
   */
  save(follow: FollowEntity): Promise<FollowEntity>;

  /**
   * Find by follower and following with optional status filter
   */
  findByPair(
    followerId: string,
    followingId: string,
    status?: EFollowStatus,
  ): Promise<FollowEntity | null>;

  /**
   * Check if an ACCEPTED follow exists
   */
  exists(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Check if a PENDING request exists
   */
  hasPendingRequest(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get relationship status between two users in a single query
   * Returns: { isFollowing, isFollowedBy, isRequested, isRequestedByThem }
   */
  getRelationship(
    viewerId: string,
    targetId: string,
  ): Promise<{
    isFollowing: boolean;
    isFollowedBy: boolean;
    isRequested: boolean;
    isRequestedByThem: boolean;
  }>;

  /**
   * Delete a follow relationship (hard delete for unfollow)
   */
  deleteFollow(followerId: string, followingId: string): Promise<boolean>;

  deleteRequest(followerId: string, followingId: string): Promise<boolean>;

  /**
   * Get followers of a user (ACCEPTED only)
   */
  findFollowers(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ userIds: string[]; nextCursor?: string }>;

  /**
   * Search followers of a user by username/firstName/lastName (ACCEPTED only).
   * Returns enriched user rows with viewer-context booleans pre-computed inside
   * the aggregation — no extra round-trips needed in the usecase.
   * Uses offset pagination (page-based) for correctness with post-join filtering.
   */
  searchFollowers(
    userId: string,
    query: string,
    limit: number,
    page: number,
  ): Promise<{ userIds: string[]; hasNext: boolean }>;

  /**
   * Get users that a user is following (ACCEPTED only)
   */
  findFollowing(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ userIds: string[]; nextCursor?: string }>;

  /**
   * Search users that a user is following by username/firstName/lastName (ACCEPTED only).
   * Returns enriched user rows with viewer-context booleans pre-computed inside
   * the aggregation — no extra round-trips needed in the usecase.
   * Uses offset pagination (page-based) for correctness with post-join filtering.
   */
  searchFollowing(
    userId: string,
    query: string,
    limit: number,
    page: number,
  ): Promise<{ userIds: string[]; hasNext: boolean }>;

  /**
   * Get pending follow requests TO a user
   */
  findPendingRequestsTo(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ follows: FollowEntity[]; nextCursor?: string }>;

  /**
   * Get pending follow requests FROM a user
   */
  findPendingRequestsFrom(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ follows: FollowEntity[]; nextCursor?: string }>;

  /**
   * Batch: Find which target users the viewer is following (ACCEPTED)
   */
  findFollowingIds(viewerId: string, targetUserIds: string[]): Promise<Set<string>>;

  /**
   * Get ALL user IDs that a user is following (ACCEPTED) — no pagination, for feed queries
   */
  findAllFollowingIds(userId: string): Promise<string[]>;

  /**
   * Batch: Find which target users are following the viewer (ACCEPTED)
   */
  findFollowedIds(viewerId: string, targetUserIds: string[]): Promise<Set<string>>;

  /**
   * Batch: Find which target users have PENDING requests from viewer
   */
  findPendingRequestIds(viewerId: string, targetUserIds: string[]): Promise<Set<string>>;

  /**
   * Get viewer's follow data for target users (both following and pending) in single query
   * Returns IDs of users viewer is following and has pending requests to
   * More efficient than calling findFollowingIds + findPendingRequestIds separately
   */
  findUserFollowData(
    viewerId: string,
    targetUserIds: string[],
  ): Promise<{ followingIds: Set<string>; pendingRequestIds: Set<string> }>;

  /**
   * Delete multiple follow relationships in a single operation
   * Useful for block scenarios where bidirectional relationships need to be removed
   */
  deleteByPairs(pairs: Array<{ followerId: string; followingId: string }>): Promise<number>;
}
