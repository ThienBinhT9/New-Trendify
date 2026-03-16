import * as Response from "@/shared/responses";
import { DeleteCommentDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ICommentRepository } from "@/domain/comment";
import { IMessageProducer } from "@/application/services";
import { ROUTING_KEYS } from "@/domain/events";

export class DeleteCommentUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly commentRepo: ICommentRepository,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: DeleteCommentDTO) {
    const { userId, postId, commentId } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    const comment = await this.commentRepo.findById(commentId);
    if (!comment || comment.isDeleted()) {
      throw new Response.NotFoundError("Comment not found");
    }

    if (comment.postId !== postId) {
      throw new Response.BadRequestError("Comment does not belong to this post");
    }

    // Authorization: comment author or post author can delete
    if (!comment.canDelete(userId, post.authorId)) {
      throw new Response.ForbiddenError("You cannot delete this comment");
    }

    // Soft delete
    comment.delete();
    await this.commentRepo.save(comment);

    // Decrement replyCount on parent comment if this is a reply
    if (comment.parentId) {
      await this.commentRepo.incrementReplyCount(comment.parentId, -1);
    }

    // Async: decrement comment count on post
    try {
      await this.producer.publish(ROUTING_KEYS.COUNTER_POST_COMMENT, {
        postId,
        postAuthorId: post.authorId,
        commentId,
        commenterId: userId,
        parentId: comment.parentId,
        delta: -1,
      });
    } catch (error) {
      console.error("[DeleteComment] Failed to publish event:", error);
      await this.postRepo.incrementCommentCount(postId, -1);
    }

    return new Response.SuccessResponse({
      message: "Comment deleted successfully",
    });
  }
}
