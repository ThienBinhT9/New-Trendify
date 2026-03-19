import * as Response from "@/shared/responses";
import { GetUserPostsDTO } from "@/application/dtos/post.dto";
import { IPostRepository, EPostStatus } from "@/domain/post";
import { ILikeRepository } from "@/domain/like";
import { ISaveRepository } from "@/domain/save";
import { IFollowRepository } from "@/domain/follow";
import { IBlockRepository } from "@/domain/block";
import { IUserRepository } from "@/domain/user";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ECommonVisibility } from "@/domain/user-setting";
import { ICacheService } from "@/application/services";
import { batchPopulateMedia } from "./media-display.mapper";

export class GetUserPostsUseCase {
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

  async execute(dto: GetUserPostsDTO) {
    const { viewerId, authorId, limit = 20, cursor, type } = dto;

    const author = await this.userRepo.findById(authorId);
    if (!author) {
      throw new Response.NotFoundError("User not found");
    }

    const isSelf = viewerId === authorId;

    let profilePictureUrl: string | undefined = undefined;
    if (author.data.profilePicture && typeof author.data.profilePicture === "string") {
      const profileMedia = await this.mediaRepo.findById(author.data.profilePicture);
      if (profileMedia) {
        const smallVariant = profileMedia.variants.find((v) => v.type === "small");
        const key = smallVariant ? smallVariant.key : profileMedia.key;
        profilePictureUrl = this.storageSvc.getPublicUrl(key);
      }
    }

    // Check block
    if (!isSelf) {
      const isBlocked = await this.blockRepo.isEitherBlocked(viewerId, authorId);
      if (isBlocked) {
        throw new Response.NotFoundError("User not found");
      }
    }

    // Determine visible statuses and visibilities
    let statuses: EPostStatus[];
    let visibilities: ECommonVisibility[];

    if (isSelf) {
      statuses = [EPostStatus.ACTIVE, EPostStatus.HIDDEN, EPostStatus.DRAFT];
      visibilities = [
        ECommonVisibility.PUBLIC,
        ECommonVisibility.FOLLOWER,
        ECommonVisibility.PRIVATE,
      ];
    } else {
      const isFollowing = await this.followRepo.exists(viewerId, authorId);
      statuses = [EPostStatus.ACTIVE];
      visibilities = isFollowing
        ? [ECommonVisibility.PUBLIC, ECommonVisibility.FOLLOWER]
        : [ECommonVisibility.PUBLIC];
    }

    const result = await this.postRepo.findByUser({
      authorId,
      statuses,
      visibilities,
      limit,
      cursor,
      type,
      pinnedFirst: !cursor, // Only pin first on first page
    });

    // Batch check like/save status + populate media
    const postIds = result.posts.map((p) => p.id!);
    const [likedPostIds, savedPostIds, mediaDisplayMap] = await Promise.all([
      this.likeRepo.findLikedPostIds(viewerId, postIds),
      this.saveRepo.findSavedPostIds(viewerId, postIds),
      batchPopulateMedia(
        result.posts.map((p) => ({ id: p.id!, mediaIds: p.mediaIds })),
        this.storageSvc,
        (ids) => this.mediaRepo.findByIds(ids),
      ),
    ]);

    const posts = result.posts.map((post) => ({
      ...post.toSnapshot(),
      author: {
        id: author.id,
        username: author.data.username,
        firstName: author.data.firstName,
        lastName: author.data.lastName,
        profilePicture: profilePictureUrl,
      },
      media: mediaDisplayMap.get(post.id!) ?? [],
    }));

    return new Response.SuccessResponse({
      message: "Posts retrieved successfully",
      data: {
        posts,
        nextCursor: result.nextCursor,
      },
    });
  }
}
