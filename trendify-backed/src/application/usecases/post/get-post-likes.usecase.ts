import * as Response from "@/shared/responses";
import { GetPostLikesDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ILikeRepository } from "@/domain/like";
import { IUserRepository } from "@/domain/user";

export class GetPostLikesUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly userRepo: IUserRepository,
  ) {}

  async execute(dto: GetPostLikesDTO) {
    const { postId, limit = 20, cursor } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    const result = await this.likeRepo.findByPost(postId, limit, cursor);

    // Enrich with user info
    const userIds = result.likes.map((l) => l.userId);
    const users = await this.userRepo.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id!, u]));

    const likes = result.likes.map((like) => {
      const user = userMap.get(like.userId);
      return {
        userId: like.userId,
        username: user?.data.username,
        firstName: user?.data.firstName,
        lastName: user?.data.lastName,
        profilePicture: user?.data.profilePicture,
        createdAt: like.data.createdAt,
      };
    });

    return new Response.SuccessResponse({
      message: "Likes retrieved successfully",
      data: {
        likes,
        nextCursor: result.nextCursor,
      },
    });
  }
}
