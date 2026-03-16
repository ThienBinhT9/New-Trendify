// ============================================================================
// ENUMS
// ============================================================================

export enum ECommentStatus {
  ACTIVE = "active",
  DELETED = "deleted",
}

// ============================================================================
// INTERFACES - SUB TYPES
// ============================================================================

/**
 * User mention in comment content
 */
export interface ICommentMention {
  userId: string;
  username: string;
  startIndex: number;
  endIndex: number;
}

// ============================================================================
// MAIN INTERFACE
// ============================================================================

export interface ICommentProps {
  // Identity
  postId: string;
  authorId: string;

  // Nesting
  parentId?: string; // null = top-level comment
  rootCommentId?: string; // top-level comment in thread (for querying all replies)

  // Content
  content: string;
  mentions: ICommentMention[];

  // Counters
  replyCount: number;
  likeCount: number;

  // Status
  status: ECommentStatus;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

export interface ICommentCreateInput {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string;
  rootCommentId?: string;
  mentions?: ICommentMention[];
}
