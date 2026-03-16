import * as Response from "@/shared/responses";
import { CreateCommentDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ICommentRepository, CommentEntity } from "@/domain/comment";
import { IBlockRepository } from "@/domain/block";
import { IMessageProducer } from "@/application/services";
import { ROUTING_KEYS } from "@/domain/events";

export class CreateCommentUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly commentRepo: ICommentRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly producer: IMessageProducer,
  ) {}

  async execute(dto: CreateCommentDTO) {
    const { userId, postId, content, parentId, mentions } = dto;

    // Validate post
    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    if (!post.canInteract()) {
      throw new Response.BadRequestError("Cannot interact with this post");
    }

    if (!post.data.settings.allowComment) {
      throw new Response.BadRequestError("Comments are disabled for this post");
    }

    // Check block
    const isBlocked = await this.blockRepo.isEitherBlocked(userId, post.authorId);
    if (isBlocked) {
      throw new Response.NotFoundError("Post not found");
    }

    // If reply, validate parent comment
    let rootCommentId: string | undefined;
    if (parentId) {
      const parentComment = await this.commentRepo.findById(parentId);
      if (!parentComment || parentComment.isDeleted()) {
        throw new Response.NotFoundError("Parent comment not found");
      }
      if (parentComment.postId !== postId) {
        throw new Response.BadRequestError("Parent comment does not belong to this post");
      }
      // Set rootCommentId: if parent is top-level, root is parent; else use parent's root
      rootCommentId = parentComment.rootCommentId ?? parentComment.id;
    }

    // Create comment
    const comment = CommentEntity.create({
      postId,
      authorId: userId,
      content,
      parentId,
      rootCommentId,
      mentions,
    });

    const created = await this.commentRepo.create(comment);

    // Increment replyCount on parent comment
    if (parentId) {
      await this.commentRepo.incrementReplyCount(parentId);
    }

    // Async: increment comment count on post
    try {
      await this.producer.publish(ROUTING_KEYS.COUNTER_POST_COMMENT, {
        postId,
        postAuthorId: post.authorId,
        commentId: created.id,
        commenterId: userId,
        parentId,
        delta: 1,
      });
    } catch (error) {
      console.error("[CreateComment] Failed to publish event:", error);
      await this.postRepo.incrementCommentCount(postId);
    }

    return new Response.SuccessResponse({
      statusCode: 201,
      message: "Comment created successfully",
      data: { comment: created.toSnapshot() },
    });
  }
}
