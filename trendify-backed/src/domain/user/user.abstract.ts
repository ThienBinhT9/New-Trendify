import { UserEntity } from "./user.entity";

export interface IUserRepository {
  save(user: UserEntity): Promise<void>;

  create(user: UserEntity): Promise<UserEntity>;

  deleteById(userId: string): Promise<void>;

  /**
   * Find users by IDs with optional field projection
   * @param ids - Array of user IDs
   * @param options - Optional projection and population settings
   */
  findById(userId: string, options?: { fields?: string[] }): Promise<UserEntity | null>;

  findByEmail(email: string): Promise<UserEntity | null>;

  findByUsername(username: string): Promise<UserEntity | null>;

  existsByEmail(email: string): Promise<boolean>;

  existsByUsername(username: string): Promise<boolean>;

  update(user: UserEntity): Promise<UserEntity>;

  /**
   * Find users by IDs with optional field projection
   * @param ids - Array of user IDs
   * @param options - Optional projection and population settings
   */
  findByIds(
    ids: string[],
    options?: {
      fields?: string[];
      lean?: boolean;
    },
  ): Promise<UserEntity[]>;

  incrementPostCount(userId: string, by?: number): Promise<void>;

  incrementFollowerCount(userId: string, by?: number): Promise<void>;

  incrementFollowingCount(userId: string, by?: number): Promise<void>;

  /**
   * Batch update follower/following counts for multiple users in a single operation
   * Uses MongoDB bulkWrite for optimal performance
   */
  batchIncrementCounts(
    operations: Array<{
      userId: string;
      followerDelta?: number;
      followingDelta?: number;
    }>,
  ): Promise<void>;

  /**
   * Search users by query string (username, firstName, lastName)
   * Uses text index for full-text search with cursor-based pagination
   */
  searchUsers(
    query: string,
    options: {
      limit: number;
      cursor?: string;
    },
  ): Promise<{
    users: UserEntity[];
    nextCursor?: string;
  }>;
}
