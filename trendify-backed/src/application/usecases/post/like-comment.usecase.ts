import * as Response from "@/shared/responses";
import { ICommentRepository } from "@/domain/comment";
import { ICommentLikeRepository } from "@/domain/comment-like";

export interface LikeCommentDTO {
  userId: string;
  postId: string;
  commentId: string;
}

export class LikeCommentUseCase {
  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly commentLikeRepo: ICommentLikeRepository,
  ) {}

  async execute(dto: LikeCommentDTO) {
    const { userId, commentId } = dto;

    const comment = await this.commentRepo.findById(commentId);
    if (!comment || comment.isDeleted()) {
      throw new Response.NotFoundError("Comment not found");
    }

    const created = await this.commentLikeRepo.create(userId, commentId);

    if (!created) {
      return new Response.SuccessResponse({
        message: "Already liked",
        data: { isLiked: true },
      });
    }

    // Increment like count on comment
    await this.commentRepo.incrementLikeCount(commentId, 1);

    return new Response.SuccessResponse({
      message: "Comment liked successfully",
      data: { isLiked: true },
    });
  }
}
