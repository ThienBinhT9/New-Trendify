import * as Response from "@/shared/responses";
import { UpdatePostDTO } from "@/application/dtos/post.dto";
import { IPostRepository, EPostType } from "@/domain/post";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ICacheService } from "@/application/services";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";
import { batchPopulateMedia, determinePostType } from "./media-display.mapper";

export class UpdatePostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly cacheService: ICacheService,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: UpdatePostDTO) {
    const { authorId, postId, ...updateData } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    if (!post.isOwnedBy(authorId)) {
      throw new Response.ForbiddenError("You can only edit your own posts");
    }

    // Media update: only removal is allowed (no adding new mediaIds)
    let newType: EPostType | undefined;
    if (updateData.mediaIds !== undefined) {
      const currentMediaIds = new Set(post.mediaIds);

      // Check that every ID in the request already exists on the post
      const addedIds = updateData.mediaIds.filter((id) => !currentMediaIds.has(id));
      if (addedIds.length > 0) {
        throw new Response.BadRequestError(
          "Cannot add new media to an existing post. Upload media first, then create a new post.",
        );
      }

      // Determine new post type from remaining media
      if (updateData.mediaIds.length > 0) {
        const remainingMedia = await this.mediaRepo.findByIds(updateData.mediaIds);
        newType = determinePostType(remainingMedia);
      } else {
        newType = EPostType.TEXT;
      }
    }

    post.update({
      content: updateData.content,
      mediaIds: updateData.mediaIds,
      type: newType,
      mentions: updateData.mentions,
      location: updateData.location,
      visibility: updateData.visibility,
      allowLike: updateData.allowLike,
      allowSave: updateData.allowSave,
      allowShare: updateData.allowShare,
      allowComment: updateData.allowComment,
      allowDownload: updateData.allowDownload,
    });

    const updated = await this.postRepo.update(post);

    // Populate media for response
    const finalMediaIds = updated?.mediaIds ?? [];
    const mediaDisplayMap = await batchPopulateMedia(
      [{ id: postId, mediaIds: finalMediaIds }],
      this.storageSvc,
      (ids) => this.mediaRepo.findByIds(ids),
    );

    // Invalidate cache
    const postCache = CacheContextBuilder.post(postId);
    const userPostsCache = CacheContextBuilder.userPosts({ authorId });
    await Promise.all([
      this.cacheService.del(postCache.key),
      this.cacheService.delByPrefix(userPostsCache.prefix),
    ]);

    return new Response.SuccessResponse({
      message: "Post updated successfully",
      data: {
        post: {
          ...updated?.toSnapshot(),
          media: mediaDisplayMap.get(postId) ?? [],
        },
      },
    });
  }
}
