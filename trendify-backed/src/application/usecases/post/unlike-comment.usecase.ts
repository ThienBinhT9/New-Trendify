import * as Response from "@/shared/responses";
import { ICommentRepository } from "@/domain/comment";
import { ICommentLikeRepository } from "@/domain/comment-like";

export interface UnlikeCommentDTO {
  userId: string;
  postId: string;
  commentId: string;
}

export class UnlikeCommentUseCase {
  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly commentLikeRepo: ICommentLikeRepository,
  ) {}

  async execute(dto: UnlikeCommentDTO) {
    const { userId, commentId } = dto;

    const comment = await this.commentRepo.findById(commentId);
    if (!comment || comment.isDeleted()) {
      throw new Response.NotFoundError("Comment not found");
    }

    const deleted = await this.commentLikeRepo.delete(userId, commentId);

    if (!deleted) {
      return new Response.SuccessResponse({
        message: "Not liked",
        data: { isLiked: false },
      });
    }

    // Decrement like count on comment
    await this.commentRepo.incrementLikeCount(commentId, -1);

    return new Response.SuccessResponse({
      message: "Comment unliked successfully",
      data: { isLiked: false },
    });
  }
}
