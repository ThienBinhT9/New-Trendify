import { SaveEntity } from "./save.entity";

export interface ISaveRepository {
  /**
   * Create a new save. Returns null if already exists (duplicate).
   */
  create(save: SaveEntity): Promise<SaveEntity | null>;

  /**
   * Delete a save. Returns true if deleted, false if not found.
   */
  delete(userId: string, postId: string): Promise<boolean>;

  /**
   * Check if user has saved a post.
   */
  exists(userId: string, postId: string): Promise<boolean>;

  /**
   * Find saved posts by user with cursor pagination.
   * Returns list of saves (newest first) and next cursor.
   */
  findByUser(
    userId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ saves: SaveEntity[]; nextCursor?: string }>;
  /**
   * Batch check if user has saved multiple posts.
   * Returns Set of postIds that user has saved.
   */
  findSavedPostIds(userId: string, postIds: string[]): Promise<Set<string>>;

  /**
   * Count saves for a user (total saved posts).
   */
  countByUser(userId: string): Promise<number>;

  /**
   * Delete all saves for a post (used when post is deleted).
   * Returns count of deleted saves.
   */
  deleteByPost(postId: string): Promise<number>;
}
