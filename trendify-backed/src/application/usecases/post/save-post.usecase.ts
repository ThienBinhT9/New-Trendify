import * as Response from "@/shared/responses";
import { SavePostDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ISaveRepository, SaveEntity } from "@/domain/save";
import { IBlockRepository } from "@/domain/block";
import { IMessageProducer } from "@/application/services";
import { ROUTING_KEYS } from "@/domain/events";

export class SavePostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: SavePostDTO) {
    const { userId, postId } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    if (!post.canInteract()) {
      throw new Response.BadRequestError("Cannot interact with this post");
    }

    if (!post.data.settings.allowSave) {
      throw new Response.BadRequestError("Saving is disabled for this post");
    }

    // Check block
    const isBlocked = await this.blockRepo.isEitherBlocked(userId, post.authorId);
    if (isBlocked) {
      throw new Response.NotFoundError("Post not found");
    }

    // Create save (idempotent)
    const save = SaveEntity.create({ userId, postId });
    const created = await this.saveRepo.create(save);

    if (!created) {
      return new Response.SuccessResponse({ message: "Already saved", data: { isSaved: true } });
    }

    // Async: increment save count
    try {
      await this.producer.publish(ROUTING_KEYS.COUNTER_POST_SAVE, {
        postId,
        userId,
        delta: 1,
      });
    } catch (error) {
      console.error("[SavePost] Failed to publish event:", error);
      await this.postRepo.incrementSaveCount(postId);
    }

    return new Response.SuccessResponse({
      message: "Post saved successfully",
      data: { isSaved: true },
    });
  }
}
