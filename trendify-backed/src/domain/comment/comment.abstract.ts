import { CommentEntity } from "./comment.entity";

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export interface FindCommentsOptions {
  postId: string;
  limit: number;
  cursor?: string;
}

export interface FindCommentRepliesOptions {
  parentId: string;
  limit: number;
  cursor?: string;
}

export interface FindCommentsResult {
  comments: CommentEntity[];
  nextCursor?: string;
}

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface ICommentRepository {
  /**
   * Create a new comment.
   */
  create(comment: CommentEntity): Promise<CommentEntity>;

  /**
   * Save (update) a comment.
   */
  save(comment: CommentEntity): Promise<void>;

  /**
   * Find a comment by ID.
   */
  findById(commentId: string): Promise<CommentEntity | null>;

  /**
   * Find top-level comments for a post (parentId = null), cursor pagination.
   */
  findByPost(options: FindCommentsOptions): Promise<FindCommentsResult>;

  /**
   * Find replies to a comment, cursor pagination (chronological order).
   */
  findReplies(options: FindCommentRepliesOptions): Promise<FindCommentsResult>;

  /**
   * Count top-level comments for a post.
   */
  countByPost(postId: string): Promise<number>;

  /**
   * Increment reply count on a comment (atomic).
   */
  incrementReplyCount(commentId: string, by?: number): Promise<void>;

  /**
   * Delete all comments for a post (cleanup when post is deleted).
   * Returns count of deleted comments.
   */
  deleteByPost(postId: string): Promise<number>;
}
