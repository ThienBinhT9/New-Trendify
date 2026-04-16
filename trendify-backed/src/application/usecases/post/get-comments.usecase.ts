import * as Response from "@/shared/responses";
import { GetCommentsDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ICommentRepository } from "@/domain/comment";
import { ICommentLikeRepository } from "@/domain/comment-like";
import { IUserRepository } from "@/domain/user";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { fetchMediaRecordFromGroups, resolveMediaDisplayList } from "@/application/mappers/media.mapper";
import { CommentMapper, UserMapper } from "@/application/mappers";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";

export class GetCommentsUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly commentRepo: ICommentRepository,
    private readonly commentLikeRepo: ICommentLikeRepository,
    private readonly userRepo: IUserRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetCommentsDTO) {
    const { viewerId, postId, limit = 20, cursor } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    const result = await this.commentRepo.findByPost({
      postId,
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

    // Batch check liked comment IDs
    const commentIds = result.comments.map((c) => c.id!).filter(Boolean);
    const likedCommentIds = viewerId
      ? await this.commentLikeRepo.findLikedCommentIds(viewerId, commentIds)
      : new Set<string>();

    // Batch resolve comment media
    const allCommentMediaIds = result.comments.flatMap((c) => c.data.mediaIds ?? []);
    const commentMediaRecord = allCommentMediaIds.length > 0
      ? await fetchMediaRecordFromGroups([allCommentMediaIds], (ids) =>
          this.mediaRepo.findByIds(ids),
        )
      : {};

    const comments = result.comments.map((comment) => {
      const author = authorMap.get(comment.authorId);
      if (!author) {
        throw new Response.NotFoundError("Comment author not found");
      }

      const authorMapped = UserMapper.toAuthorDTO(author, mediaRecord, this.storageSvc);
      const viewerContext = ViewerContextBuilder.buildComment({
        viewerId,
        postAuthorId: post.authorId,
        commentAuthorId: comment.authorId,
        isLiked: likedCommentIds.has(comment.id!),
      });

      const commentMedia = resolveMediaDisplayList(
        comment.data.mediaIds ?? [],
        commentMediaRecord,
        this.storageSvc,
      );

      return CommentMapper.toResponseDTO(comment, authorMapped, viewerContext, commentMedia);
    });

    return new Response.SuccessResponse({
      message: "Comments retrieved successfully",
      data: {
        comments,
        nextCursor: result.nextCursor,
      },
    });
  }
}
