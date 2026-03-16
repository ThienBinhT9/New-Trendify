import { ECommonVisibility } from "../user-setting";
import { PostEntity } from "./post.entity";
import { EPostStatus, EPostType } from "./post.type";

// ============================================================================
// QUERY OPTIONS
// ============================================================================

export interface FindUserPostsOptions {
  authorId: string;
  statuses: EPostStatus[];
  visibilities: ECommonVisibility[];
  limit: number;
  cursor?: string;
  type?: EPostType; // Filter by post type
  pinnedFirst?: boolean; // Show pinned posts first
}

export interface FindUserPostsResult {
  posts: PostEntity[];
  nextCursor?: string;
}

export interface FindRepliesOptions {
  postId: string;
  limit: number;
  cursor?: string;
}

export interface FindByHashtagOptions {
  hashtag: string;
  limit: number;
  cursor?: string;
}

export interface FindFeedOptions {
  authorIds: string[];
  limit: number;
  cursor?: string;
}

// ============================================================================
// REPOSITORY INTERFACE
// ============================================================================

export interface IPostRepository {
  // CRUD
  create(post: PostEntity): Promise<PostEntity | null>;
  update(post: PostEntity): Promise<PostEntity | null>;
  save(post: PostEntity): Promise<void>;
  delete(postId: string): Promise<void>;

  // Queries
  findById(postId: string): Promise<PostEntity | null>;
  findManyByIds(ids: string[]): Promise<PostEntity[]>;
  findByUser(options: FindUserPostsOptions): Promise<FindUserPostsResult>;
  findFeed(options: FindFeedOptions): Promise<FindUserPostsResult>;

  // Reply/Thread queries
  findReplies(options: FindRepliesOptions): Promise<FindUserPostsResult>;
  countReplies(postId: string): Promise<number>;

  // Hashtag queries
  findByHashtag(options: FindByHashtagOptions): Promise<FindUserPostsResult>;

  // Pinned posts
  findPinnedByUser(authorId: string): Promise<PostEntity[]>;

  // Counter operations (atomic)
  incrementLikeCount(postId: string, by?: number): Promise<void>;
  incrementCommentCount(postId: string, by?: number): Promise<void>;
  incrementShareCount(postId: string, by?: number): Promise<void>;
  incrementViewCount(postId: string, by?: number): Promise<void>;
  incrementRepostCount(postId: string, by?: number): Promise<void>;
  incrementSaveCount(postId: string, by?: number): Promise<void>;

  // Sync counters from external source (e.g., Redis)
  setLikeCount(postId: string, count: number): Promise<void>;
  setViewCount(postId: string, count: number): Promise<void>;
}

// Legacy interface - can be removed later
export interface IPostLikeRepository {
  incrementLike(postId: string, by?: number): Promise<void>;
  incrementShare(postId: string, by?: number): Promise<void>;
  incrementComment(postId: string, by?: number): Promise<void>;
}
