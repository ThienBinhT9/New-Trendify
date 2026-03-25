import { ECommonVisibility } from "@/domain/user-setting";
import {
  EPostStatus,
  EPostType,
  IPostCounters,
  IPostHashtag,
  IPostLocation,
  IPostMention,
  IPostProps,
  IPostSettings,
} from "@/domain/post";
import { ICommentCounters, ICommentHashtag, ICommentMention } from "@/domain/comment";
import { AuthorDTO } from "@/application/mappers/user.mapper";
import { MediaDisplay } from "@/application/mappers/media.mapper";
import {
  ICommentViewerContext,
  IPostViewerContext,
} from "@/application/policies/viewer-context.builder";
import { ECommentStatus } from "@/domain/comment";

export interface CreatePostDTO {
  authorId: string;
  content?: string;
  mediaIds?: string[];
  mentions?: IPostMention[];
  location?: IPostLocation;
  visibility?: ECommonVisibility;
  allowLike?: boolean;
  allowSave?: boolean;
  allowShare?: boolean;
  allowComment?: boolean;
  allowDownload?: boolean;
  canLike?: boolean;
  canSave?: boolean;
  canShare?: boolean;
  canComment?: boolean;
  replyToId?: string;
  isDraft?: boolean;
}

export interface GetPostDTO {
  viewerId: string;
  postId: string;
}

export interface UpdatePostDTO {
  authorId: string;
  postId: string;
  content?: string;
  mediaIds?: string[];
  mentions?: IPostMention[];
  location?: IPostLocation | null;
  visibility?: ECommonVisibility;
  allowLike?: boolean;
  allowSave?: boolean;
  allowShare?: boolean;
  allowComment?: boolean;
  allowDownload?: boolean;
}

export interface DeletePostDTO {
  authorId: string;
  postId: string;
}

export interface GetUserPostsDTO {
  viewerId: string;
  authorId: string;
  limit?: number;
  cursor?: string;
  type?: EPostType;
}

export interface GetFollowingFeedDTO {
  viewerId: string;
  limit?: number;
  cursor?: string;
}

export interface SavePostDTO {
  userId: string;
  postId: string;
}

export interface UnsavePostDTO {
  userId: string;
  postId: string;
}

export interface GetSavedPostsDTO {
  userId: string;
  limit?: number;
  cursor?: string;
}

export interface GetDraftPostsDTO {
  userId: string;
  limit?: number;
  cursor?: string;
  type?: EPostType;
}

// ====================== CACHE TYPES ======================

export interface CachedPostsData {
  items: IPostProps[];
  nextCursor?: string;
}

// ====================== LIKE TYPES ======================

export interface LikePostDTO {
  userId: string;
  postId: string;
}

export interface UnlikePostDTO {
  userId: string;
  postId: string;
}

export interface GetPostLikesDTO {
  postId: string;
  limit?: number;
  cursor?: string;
}

export interface PostLikedPayload {
  postId: string;
  postAuthorId: string;
  likerId: string;
  likerUsername: string;
}

export interface SyncLikeCountPayload {
  postId: string;
}

// ====================== RESPONSE SHAPES ======================

export interface PostCoreResponseDTO {
  id: string;
  type: EPostType;
  content?: string;
  hashtags: IPostHashtag[];
  mentions: IPostMention[];
  location?: IPostLocation;
  status: EPostStatus;
  settings: Readonly<IPostSettings>;
  isPinned: boolean;
  counters: Readonly<IPostCounters>;
  replyToId?: string;
  rootPostId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostResponseDTO extends PostCoreResponseDTO {
  author: AuthorDTO;
  media: MediaDisplay[];
  viewerContext: IPostViewerContext;
}

// ====================== COMMENT TYPES ======================

export interface CreateCommentDTO {
  userId: string;
  postId: string;
  content: string;
  parentId?: string;
  mentions?: ICommentMention[];
}

export interface GetCommentsDTO {
  viewerId: string;
  postId: string;
  limit?: number;
  cursor?: string;
}

export interface GetCommentRepliesDTO {
  viewerId: string;
  postId: string;
  commentId: string;
  limit?: number;
  cursor?: string;
}

export interface DeleteCommentDTO {
  userId: string;
  postId: string;
  commentId: string;
}

export interface CommentCoreResponseDTO {
  id: string;
  postId: string;
  parentId?: string;
  rootCommentId?: string;
  content: string;
  mentions: ICommentMention[];
  hashtags: ICommentHashtag[];
  counters: ICommentCounters;
  status: ECommentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CommentResponseDTO extends CommentCoreResponseDTO {
  author: AuthorDTO;
  viewerContext: ICommentViewerContext;
}
