import { ECommonVisibility } from "../user-setting";

// ============================================================================
// ENUMS
// ============================================================================

export enum EPostAccessLevel {
  SELF = "self",
  FOLLOWER = "follower",
  PUBLIC = "public",
}

export enum EPostStatus {
  ACTIVE = "active",
  DRAFT = "draft",
}

export enum EPostType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
}

// ============================================================================
// INTERFACES - SUB TYPES
// ============================================================================
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
export interface IPostLocation {
  name: string;
  address?: string;
  placeId?: string; // Google Places ID or similar
  coordinates?: { lat: number; lng: number };
}

export interface IPostSettings {
  visibility: ECommonVisibility;
  allowLike: boolean;
  allowSave: boolean;
  allowShare: boolean;
  allowComment: boolean;
  allowDownload: boolean;
}
export interface IPostCounters {
  likeCount: number;
  viewCount: number;
  saveCount: number;
  shareCount: number;
  repostCount: number;
  commentCount: number;
}

export interface IPostProps {
  // Identity
  authorId: string;
  type: EPostType;

  // Content
  content?: string;
  mediaIds: string[];
  hashtags: IPostHashtag[];
  mentions: IPostMention[];

  // Relationships
  replyToId?: string; // For reply threads
  rootPostId?: string; // Original post in thread (for nested replies)

  // Location
  location?: IPostLocation;

  // Status & Settings
  status: EPostStatus;
  settings: IPostSettings;
  isPinned: boolean;

  // Counters
  counters: IPostCounters;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// INPUT INTERFACES
// ============================================================================

export interface IPostCreateInput {
  authorId: string;
  type?: EPostType;
  content?: string;
  mediaIds?: string[];
  mentions?: IPostMention[];
  location?: IPostLocation;
  replyToId?: string;
  visibility?: ECommonVisibility;
  isDraft?: boolean;
}
