import { LikeEntity } from "./like.entity";

export interface ILikeRepository {
  /**
   * Create a new like. Returns null if already exists (duplicate).
   */
  create(like: LikeEntity): Promise<LikeEntity | null>;

  /**
   * Delete a like. Returns true if deleted, false if not found.
   */
  delete(userId: string, postId: string): Promise<boolean>;

  /**
   * Check if user has liked a post.
   */
  exists(userId: string, postId: string): Promise<boolean>;

  /**
   * Find likes by post with cursor pagination.
   */
  findByPost(
    postId: string,
    limit: number,
    cursor?: string,
  ): Promise<{ likes: LikeEntity[]; nextCursor?: string }>;

  /**
   * Batch check if user has liked multiple posts.
   * Returns Set of postIds that user has liked.
   */
  findLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>>;

  /**
   * Count likes for a post.
   */
  countByPost(postId: string): Promise<number>;

  /**
   * Delete all likes for a post (used when post is deleted).
   * Returns count of deleted likes.
   */
  deleteByPost(postId: string): Promise<number>;
}
