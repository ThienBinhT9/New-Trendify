import * as Response from "@/shared/responses";
import { UnlikePostDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ILikeRepository } from "@/domain/like";
import { IMessageProducer } from "@/application/services";
import { ROUTING_KEYS } from "@/domain/events";

export class UnlikePostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: UnlikePostDTO) {
    const { userId, postId } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    const deleted = await this.likeRepo.delete(userId, postId);
    if (!deleted) {
      return new Response.SuccessResponse({ message: "Not liked", data: { isLiked: false } });
    }

    // Async: decrement like count
    try {
      await this.producer.publish(ROUTING_KEYS.COUNTER_POST_LIKE, {
        postId,
        postAuthorId: post.authorId,
        likerId: userId,
        delta: -1,
      });
    } catch (error) {
      console.error("[UnlikePost] Failed to publish event:", error);
      await this.postRepo.incrementLikeCount(postId, -1);
    }

    return new Response.SuccessResponse({
      message: "Post unliked successfully",
      data: { isLiked: false },
    });
  }
}
