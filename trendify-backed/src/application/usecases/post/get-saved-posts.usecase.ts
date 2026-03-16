import * as Response from "@/shared/responses";
import { GetSavedPostsDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ISaveRepository } from "@/domain/save";
import { ILikeRepository } from "@/domain/like";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { batchPopulateMedia } from "./media-display.mapper";

export class GetSavedPostsUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetSavedPostsDTO) {
    const { userId, limit = 20, cursor } = dto;

    const result = await this.saveRepo.findByUser(userId, limit, cursor);

    // Get post IDs from saves
    const postIds = result.saves.map((s) => s.postId);
    if (postIds.length === 0) {
      return new Response.SuccessResponse({
        message: "Saved posts retrieved successfully",
        data: { posts: [], nextCursor: undefined },
      });
    }

    // Fetch posts + like status + media in parallel
    const posts = await this.postRepo.findManyByIds(postIds);
    const postMap = new Map(posts.map((p) => [p.id!, p]));

    const activePosts = posts.filter((p) => !p.isDeleted());
    const [likedPostIds, mediaDisplayMap] = await Promise.all([
      this.likeRepo.findLikedPostIds(userId, postIds),
      batchPopulateMedia(
        activePosts.map((p) => ({ id: p.id!, mediaIds: p.mediaIds })),
        this.storageSvc,
        (ids) => this.mediaRepo.findByIds(ids),
      ),
    ]);

    // Maintain save order (newest saved first)
    const orderedPosts = result.saves
      .map((save) => {
        const post = postMap.get(save.postId);
        if (!post || post.isDeleted()) return null;
        return {
          ...post.toSnapshot(),
          media: mediaDisplayMap.get(post.id!) ?? [],
          isLiked: likedPostIds.has(post.id!),
          isSaved: true,
          savedAt: save.createdAt,
        };
      })
      .filter(Boolean);

    return new Response.SuccessResponse({
      message: "Saved posts retrieved successfully",
      data: {
        posts: orderedPosts,
        nextCursor: result.nextCursor,
      },
    });
  }
}
