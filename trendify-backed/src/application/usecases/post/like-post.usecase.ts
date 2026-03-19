import * as Response from "@/shared/responses";
import { LikePostDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ILikeRepository, LikeEntity } from "@/domain/like";
import { IBlockRepository } from "@/domain/block";
import { IMessageProducer } from "@/application/services";
import { ROUTING_KEYS } from "@/domain/events";

export class LikePostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: LikePostDTO) {
    const { userId, postId } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    if (!post.canInteract()) {
      throw new Response.BadRequestError("Cannot interact with this post");
    }

    if (!post.data.settings.allowLike) {
      throw new Response.BadRequestError("Likes are disabled for this post");
    }

    // Check block
    const isBlocked = await this.blockRepo.isEitherBlocked(userId, post.authorId);
    if (isBlocked) {
      throw new Response.NotFoundError("Post not found");
    }

    // Create like (idempotent — returns null if already exists)
    const like = LikeEntity.create({ userId, postId });
    const created = await this.likeRepo.create(like);

    if (!created) {
      return new Response.SuccessResponse({ message: "Already liked", data: { isLiked: true } });
    }

    // Async: increment like count
    try {
      await this.producer.publish(ROUTING_KEYS.COUNTER_POST_LIKE, {
        postId,
        postAuthorId: post.authorId,
        likerId: userId,
        delta: 1,
      });
    } catch (error) {
      console.error("[LikePost] Failed to publish event:", error);
      // Fallback: direct increment
      await this.postRepo.incrementLikeCount(postId);
    }

    return new Response.SuccessResponse({
      message: "Post liked successfully",
      data: { isLiked: true },
    });
  }
}
