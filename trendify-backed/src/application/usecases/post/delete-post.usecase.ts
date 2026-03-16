import * as Response from "@/shared/responses";
import { DeletePostDTO } from "@/application/dtos/post.dto";
import { IUnitOfWorkFactory } from "@/domain/unit-of-work";
import { ILikeRepository } from "@/domain/like";
import { ISaveRepository } from "@/domain/save";
import { ICommentRepository } from "@/domain/comment";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ICacheService } from "@/application/services";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";

export class DeletePostUseCase {
  constructor(
    private readonly uowFactory: IUnitOfWorkFactory,
    private readonly likeRepo: ILikeRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly commentRepo: ICommentRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
    private readonly cacheService: ICacheService,
  ) {}

  async execute(dto: DeletePostDTO) {
    const { authorId, postId } = dto;

    const uow = await this.uowFactory.create();

    try {
      const post = await uow.posts.findById(postId);
      if (!post) {
        throw new Response.NotFoundError("Post not found");
      }

      if (!post.isOwnedBy(authorId)) {
        throw new Response.ForbiddenError("You can only delete your own posts");
      }

      const mediaIds = [...post.mediaIds];

      // Hard delete the post and decrement count atomically
      await uow.posts.delete(postId);
      await uow.users.incrementPostCount(authorId, -1);

      await uow.commit();

      // Async cleanup (non-blocking)
      Promise.all([
        this.likeRepo.deleteByPost(postId),
        this.saveRepo.deleteByPost(postId),
        this.commentRepo.deleteByPost(postId),
        this.cleanupMedia(mediaIds),
      ]).catch((error) => {
        console.error("[DeletePost] Cleanup failed:", error);
      });

      // Invalidate cache
      const postCache = CacheContextBuilder.post(postId);
      const userPostsCache = CacheContextBuilder.userPosts({ authorId });
      await Promise.all([
        this.cacheService.del(postCache.key),
        this.cacheService.delByPrefix(userPostsCache.prefix),
      ]);

      return new Response.SuccessResponse({ message: "Post deleted successfully" });
    } catch (error) {
      await uow.rollback();
      throw error;
    }
  }

  private async cleanupMedia(mediaIds: string[]): Promise<void> {
    if (mediaIds.length === 0) return;

    // Fetch media entities to get all S3 keys (original + variants)
    const mediaEntities = await this.mediaRepo.findByIds(mediaIds);

    // Collect all S3 keys
    const allKeys = mediaEntities.flatMap((m) => m.getAllKeys());

    // Delete from S3 and DB in parallel
    await Promise.all([
      allKeys.length > 0 ? this.storageSvc.deleteFiles(allKeys) : Promise.resolve(),
      this.mediaRepo.deleteByIds(mediaIds),
    ]);
  }
}
