import { CommentEntity } from "@/domain/comment";
import { AuthorDTO } from "./user.mapper";
import { ICommentViewerContext } from "@/application/policies/viewer-context.builder";
import { CommentResponseDTO, CommentCoreResponseDTO } from "@/application/dtos/post.dto";
import { MediaDisplay } from "@/application/mappers/media.mapper";

export class CommentMapper {
  static toCoreDTO(comment: CommentEntity): CommentCoreResponseDTO {
    if (!comment.id) {
      throw new Error("Cannot map CommentEntity without id");
    }

    return {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId,
      rootCommentId: comment.rootCommentId,
      content: comment.content,
      mentions: comment.data.mentions,
      hashtags: comment.data.hashtags,
      counters: comment.data.counters,
      mediaIds: comment.data.mediaIds ?? [],
      status: comment.status,
      createdAt: comment.data.createdAt.toISOString(),
      updatedAt: comment.data.updatedAt.toISOString(),
    };
  }

  static toResponseDTO(
    comment: CommentEntity,
    author: AuthorDTO,
    viewerContext: ICommentViewerContext,
    media: MediaDisplay[] = [],
  ): CommentResponseDTO {
    return {
      ...CommentMapper.toCoreDTO(comment),
      author,
      media,
      viewerContext,
    };
  }
}
