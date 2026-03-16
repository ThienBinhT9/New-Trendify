import * as Response from "@/shared/responses";
import { GetCommentRepliesDTO } from "@/application/dtos/post.dto";
import { ICommentRepository } from "@/domain/comment";
import { IUserRepository } from "@/domain/user";

export class GetCommentRepliesUseCase {
  constructor(
    private readonly commentRepo: ICommentRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: GetCommentRepliesDTO) {
    const { commentId, limit = 20, cursor } = dto;

    const parentComment = await this.commentRepo.findById(commentId);
    if (!parentComment || parentComment.isDeleted()) {
      throw new Response.NotFoundError("Comment not found");
    }

    const result = await this.commentRepo.findReplies({
      parentId: commentId,
      limit,
      cursor,
    });

    // Enrich with author info
    const authorIds = [...new Set(result.comments.map((c) => c.authorId))];
    const authors = await this.userRepo.findByIds(authorIds);
    const authorMap = new Map(authors.map((u) => [u.id!, u]));

    const replies = result.comments.map((comment) => {
      const author = authorMap.get(comment.authorId);
      return {
        ...comment.toSnapshot(),
        author: author
          ? {
              id: author.id,
              username: author.data.username,
              firstName: author.data.firstName,
              lastName: author.data.lastName,
              profilePicture: author.data.profilePicture,
            }
          : null,
      };
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
