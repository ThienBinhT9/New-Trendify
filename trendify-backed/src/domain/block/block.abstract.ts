import { BlockEntity } from "./block.entity";

/**
 * Block Repository Interface
 */
export interface IBlockRepository {
  /**
   * Create a new block
   */
  create(entity: BlockEntity): Promise<BlockEntity | null>;

  /**
   * Delete a block (unblock)
   */
  delete(blockerId: string, blockedId: string): Promise<boolean>;

  /**
   * Find block by blocker and blocked user
   */
  findByPair(blockerId: string, blockedId: string): Promise<BlockEntity | null>;

  /**
   * Check if user A has blocked user B
   */
  isBlocked(blockerId: string, blockedId: string): Promise<boolean>;

  /**
   * Check if either user has blocked the other (bidirectional check)
   */
  isEitherBlocked(userIdA: string, userIdB: string): Promise<boolean>;

  /**
   * Get all users blocked by a user (with pagination)
   */
  findBlockedByUser(
    blockerId: string,
    options: { limit: number; cursor?: string },
  ): Promise<{ blocks: BlockEntity[]; nextCursor?: string }>;

  /**
   * Count total blocks by user
   */
  countByBlocker(blockerId: string): Promise<number>;

  /**
   * Get all user IDs that have any block relationship with userId (bidirectional)
   * i.e. users that userId blocked OR users that blocked userId
   */
  findBidirectionalBlockedIds(userId: string): Promise<string[]>;

  /**
   * Delete all blocks when user is deleted
   */
  deleteAllByUser(userId: string): Promise<number>;
}
