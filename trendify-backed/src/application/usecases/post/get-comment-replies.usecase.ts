import * as Response from "@/shared/responses";
import { GetCommentRepliesDTO } from "@/application/dtos/post.dto";
import { ICommentRepository } from "@/domain/comment";
import { IUserRepository } from "@/domain/user";
import { IPostRepository } from "@/domain/post";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { fetchMediaRecordFromGroups } from "@/application/mappers/media.mapper";
import { CommentMapper, UserMapper } from "@/application/mappers";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";

export class GetCommentRepliesUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly commentRepo: ICommentRepository,
    private readonly userRepo: IUserRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetCommentRepliesDTO) {
    const { viewerId, postId, commentId, limit = 20, cursor } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    const parentComment = await this.commentRepo.findById(commentId);
    if (!parentComment || parentComment.isDeleted()) {
      throw new Response.NotFoundError("Comment not found");
    }

    if (parentComment.postId !== postId) {
      throw new Response.BadRequestError("Comment does not belong to this post");
    }

    const result = await this.commentRepo.findReplies({
      parentId: commentId,
      limit,
      cursor,
    });

    const authorIds = [...new Set(result.comments.map((c) => c.authorId))];
    const authors = await this.userRepo.findByIds(authorIds);
    const authorMap = new Map(authors.map((u) => [u.id!, u]));
    const profilePictureIds = authors
      .map((author) =>
        typeof author.data.profilePicture === "string" ? author.data.profilePicture : undefined,
      )
      .filter((id): id is string => !!id);
    const mediaRecord = await fetchMediaRecordFromGroups([profilePictureIds], (ids) =>
      this.mediaRepo.findByIds(ids),
    );

    const replies = result.comments.map((comment) => {
      const author = authorMap.get(comment.authorId);
      if (!author) {
        throw new Response.NotFoundError("Comment author not found");
      }

      const authorMapped = UserMapper.toAuthorDTO(author, mediaRecord, this.storageSvc);
      const viewerContext = ViewerContextBuilder.buildComment({
        viewerId,
        postAuthorId: post.authorId,
        commentAuthorId: comment.authorId,
        isLiked: false,
      });

      return CommentMapper.toResponseDTO(comment, authorMapped, viewerContext);
    });

    return new Response.SuccessResponse({
      message: "Replies retrieved successfully",
      data: {
        replies,
        nextCursor: result.nextCursor,
      },
    });
  }
}
