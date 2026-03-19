import * as Response from "@/shared/responses";
import { GetPostDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ILikeRepository } from "@/domain/like";
import { ISaveRepository } from "@/domain/save";
import { IFollowRepository } from "@/domain/follow";
import { IBlockRepository } from "@/domain/block";
import { IUserRepository } from "@/domain/user";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ICacheService } from "@/application/services";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import { batchPopulateMedia } from "./media-display.mapper";

export class GetPostUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly userRepo: IUserRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly followRepo: IFollowRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly cacheService: ICacheService,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetPostDTO) {
    const { viewerId, postId } = dto;

    const post = await this.postRepo.findById(postId);
    if (!post || post.isDeleted()) {
      throw new Response.NotFoundError("Post not found");
    }

    // Check if viewer is blocked by post author
    const isBlocked = await this.blockRepo.isEitherBlocked(viewerId, post.authorId);
    if (isBlocked && !post.isOwnedBy(viewerId)) {
      throw new Response.NotFoundError("Post not found");
    }

    // Check follow status for visibility
    const isFollowingAuthor =
      viewerId !== post.authorId ? await this.followRepo.exists(viewerId, post.authorId) : false;

    // Check visibility
    if (post.isPrivate() && !post.isOwnedBy(viewerId)) {
      throw new Response.NotFoundError("Post not found");
    }
    if (post.isFollowerOnly() && !isFollowingAuthor && !post.isOwnedBy(viewerId)) {
      throw new Response.NotFoundError("Post not found");
    }

    // Batch check like/save status + populate media
    const [isLiked, isSaved, mediaDisplayMap] = await Promise.all([
      this.likeRepo.exists(viewerId, postId),
      this.saveRepo.exists(viewerId, postId),
      batchPopulateMedia([{ id: post.id!, mediaIds: post.mediaIds }], this.storageSvc, (ids) =>
        this.mediaRepo.findByIds(ids),
      ),
    ]);

    // Build viewer context
    const viewerContext = ViewerContextBuilder.buildPost({
      viewerId,
      postAuthorId: post.authorId,
      postSettings: post.data.settings,
      isLiked,
      isSaved,
      isFollowingAuthor,
      isBlocked,
    });

    // Fetch author info to return
    let profilePictureUrl: string | undefined = undefined;
    const authorUser = await this.userRepo.findById(post.authorId);

    if (authorUser?.data.profilePicture) {
      if (typeof authorUser.data.profilePicture === "string") {
        const profileMedia = await this.mediaRepo.findById(authorUser.data.profilePicture);
        if (profileMedia) {
          const smallVariant = profileMedia.variants.find((v) => v.type === "small");
          const key = smallVariant ? smallVariant.key : profileMedia.key;
          profilePictureUrl = this.storageSvc.getPublicUrl(key);
        }
      }
    }

    return new Response.SuccessResponse({
      message: "Post retrieved successfully",
      data: {
        post: {
          ...post.toSnapshot(),
          author: {
            id: authorUser?.id,
            username: authorUser?.data.username,
            firstName: authorUser?.data.firstName,
            lastName: authorUser?.data.lastName,
            profilePicture: profilePictureUrl,
          },
          media: mediaDisplayMap.get(post.id!) ?? [],
        },
        viewerContext,
      },
    });
  }
}
