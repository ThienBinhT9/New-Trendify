import {
  IPostLocation,
  IPostSettings,
  IPostCounters,
  IPostMention,
  IPostHashtag,
  EPostStatus,
  EPostType,
  PostEntity,
} from "@/domain/post";
import { AuthorDTO } from "./user.mapper";
import { MediaDisplay } from "@/application/mappers/media.mapper";
import { IPostViewerContext } from "@/application/policies/viewer-context.builder";
import { PostResponseDTO } from "@/application/dtos/post.dto";

export interface PostSummaryDTO {
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

export interface PaginatedPostDTO {
  data: PostSummaryDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class PostMapper {
  static toCoreDTO(post: PostEntity): PostSummaryDTO {
    if (!post.id) {
      throw new Error("Cannot map PostEntity without id");
    }

    return {
      id: post.id,
      type: post.data.type,
      content: post.data.content,
      hashtags: post.data.hashtags,
      mentions: post.data.mentions,
      location: post.data.location,
      status: post.data.status,
      settings: post.data.settings,
      isPinned: post.data.isPinned,
      counters: post.data.counters,
      replyToId: post.data.replyToId,
      rootPostId: post.data.rootPostId,
      createdAt: post.data.createdAt.toISOString(),
      updatedAt: post.data.updatedAt.toISOString(),
    };
  }

  static toResponseDTO(
    post: PostEntity,
    author: AuthorDTO,
    media: MediaDisplay[],
    viewerContext: IPostViewerContext,
  ): PostResponseDTO {
    return {
      ...PostMapper.toCoreDTO(post),
      author,
      media,
      viewerContext,
    };
  }
}
