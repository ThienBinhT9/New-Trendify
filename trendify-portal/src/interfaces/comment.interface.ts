import { IPictureUrl } from "./user.interface";

export interface ICommentAuthor {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: IPictureUrl;
  isVerified?: boolean;

  // Backward-compatible optional fields for existing mock data
  firstName?: string;
  lastName?: string;
}

export interface ICommentMention {
  userId: string;
  username: string;
  startIndex: number;
  endIndex: number;
}

export interface ICommentHashtag {
  tag: string;
  startIndex: number;
  endIndex: number;
}

export interface ICommentCounters {
  likeCount: number;
  replyCount: number;
}

export interface ICommentViewerContext {
  isAuthorPost: boolean;
  isAuthor: boolean;
  isLiked: boolean;
  canDelete: boolean;
}
export interface IComment {
  id: string;
  postId: string;
  content: string;
  mentions: ICommentMention[];
  hashtags: ICommentHashtag[];
  author: ICommentAuthor;
  viewerContext: ICommentViewerContext;
  parentId: string | null;
  rootCommentId?: string | null;
  createdAt: string;
  updatedAt: string;
  counters: ICommentCounters;
}
