import * as Response from "@/shared/responses";
import { UnsavePostDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ISaveRepository } from "@/domain/save";
import { IMessageProducer } from "@/application/services";
import { ROUTING_KEYS } from "@/domain/events";

export class UnsavePostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: UnsavePostDTO) {
    const { userId, postId } = dto;

    const deleted = await this.saveRepo.delete(userId, postId);
    if (!deleted) {
      return new Response.SuccessResponse({
        message: "Not saved",
        data: { isSaved: false },
      });
    }

    // Async: decrement save count
    try {
      await this.producer.publish(ROUTING_KEYS.COUNTER_POST_SAVE, {
        postId,
        userId,
        delta: -1,
      });
    } catch (error) {
      console.error("[UnsavePost] Failed to publish event:", error);
      await this.postRepo.incrementSaveCount(postId, -1);
    }

    return new Response.SuccessResponse({
      message: "Post unsaved successfully",
      data: { isSaved: false },
    });
  }
}
