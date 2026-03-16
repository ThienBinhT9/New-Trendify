import * as Response from "@/shared/responses";
import { GetCommentsDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ICommentRepository } from "@/domain/comment";
import { IUserRepository } from "@/domain/user";

export class GetCommentsUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly commentRepo: ICommentRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: GetCommentsDTO) {
    const { postId, limit = 20, cursor } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    const result = await this.commentRepo.findByPost({
      postId,
      limit,
      cursor,
    });

    // Enrich with author info
    const authorIds = [...new Set(result.comments.map((c) => c.authorId))];
    const authors = await this.userRepo.findByIds(authorIds);
    const authorMap = new Map(authors.map((u) => [u.id!, u]));

    const comments = result.comments.map((comment) => {
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
      message: "Comments retrieved successfully",
      data: {
        comments,
        nextCursor: result.nextCursor,
      },
    });
  }
}
