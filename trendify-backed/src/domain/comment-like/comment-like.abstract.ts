export interface ICommentLikeRepository {
  /**
   * Create a new comment like. Returns false if already exists (duplicate).
   */
  create(userId: string, commentId: string): Promise<boolean>;

  /**
   * Delete a comment like. Returns true if deleted, false if not found.
   */
  delete(userId: string, commentId: string): Promise<boolean>;

  /**
   * Check if user has liked a comment.
   */
  exists(userId: string, commentId: string): Promise<boolean>;

  /**
   * Batch check if user has liked multiple comments.
   * Returns Set of commentIds that user has liked.
   */
  findLikedCommentIds(userId: string, commentIds: string[]): Promise<Set<string>>;

  /**
   * Delete all likes for a comment (cleanup when comment is deleted).
   */
  deleteByComment(commentId: string): Promise<number>;
}
