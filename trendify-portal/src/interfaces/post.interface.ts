import { EVisibility } from "./common.interface";
import { IPictureUrl } from "./user.interface";

export type PostType = "text" | "image" | "video";

export enum EPostType {
  text = "text",
  image = "image",
  video = "video",
}

export interface IPostMention {
  userId: string;
  username: string;
  startIndex: number;
  endIndex: number;
}

export interface IPostHashtag {
  tag: string;
  startIndex: number;
  endIndex: number;
}

export enum EPostStatus {
  ACTIVE = "active",
  HIDDEN = "hidden",
  DELETED = "deleted",
  DRAFT = "draft",
}

export interface IPostSettings {
  visibility: EVisibility;
  allowLike: boolean;
  allowSave: boolean;
  allowShare: boolean;
  allowComment: boolean;
  allowDownload: boolean; // For media
}

export interface IPostCounters {
  likeCount: number;
  viewCount: number;
  saveCount: number;
  shareCount: number;
  repostCount: number;
  commentCount: number;
}

export interface IPostAuthor {
  id: string;
  displayName: string;
  username: string;
  profilePicture: IPictureUrl;
}

export interface IPostLocation {
  name: string;
  address?: string;
  placeId?: string;
  coordinates?: { lat: number; lng: number };
}

export interface IPostCreateInput {
  authorId: string;
  content?: string;
  mentions?: IPostMention[];
  location?: IPostLocation;
  replyToId?: string;
  visibility?: EVisibility;
  isDraft?: boolean;
}

export interface IPost {
  id: string;
  type: PostType;
  content: string;
  mentions?: IPostMention[];
  hashtags?: IPostHashtag[];
  status: EPostStatus;
  settings: IPostSettings;
  isPinned: boolean;
  counters: IPostCounters;
  author: IPostAuthor;
  createdAt: string;
  updatedAt: string;
  location?: IPostLocation;
  replyToId?: string;
  rootPostId?: string;
}

export interface IPostViewerContext {
  isAuthor: boolean;
  isFollowingAuthor: boolean;
  isLiked: boolean;
  isSaved: boolean;
  canLike: boolean;
  canSave: boolean;
  canShare: boolean;
  canComment: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export type ContentPart =
  | { type: "text"; value: string }
  | { type: "mention"; userId: string; username: string }
  | { type: "hashtag"; tag: string };
