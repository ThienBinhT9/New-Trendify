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
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import { batchResolveMediaDisplays } from "@/application/mappers/media.mapper";
import { PostMapper, UserMapper } from "@/application/mappers";
import { MediaEntity } from "@/domain/media";

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

    const authorProfileMedia =
      author.data.profilePicture && typeof author.data.profilePicture === "string"
        ? await this.mediaRepo.findById(author.data.profilePicture)
        : undefined;

    const authorMediaRecord: Record<string, MediaEntity> = {};
    if (authorProfileMedia?.id) {
      authorMediaRecord[authorProfileMedia.id] = authorProfileMedia;
    }

    const authorMapped = UserMapper.toAuthorDTO(author, authorMediaRecord, this.storageSvc);

    // Check block
    if (!isSelf) {
      const isBlocked = await this.blockRepo.isEitherBlocked(viewerId, authorId);
      if (isBlocked) {
        throw new Response.NotFoundError("User not found");
      }
    }

    // Determine visible statuses and visibilities
    const statuses: EPostStatus[] = [EPostStatus.ACTIVE];
    let visibilities: ECommonVisibility[];
    let isFollowingAuthor = false;

    if (isSelf) {
      visibilities = [
        ECommonVisibility.PUBLIC,
        ECommonVisibility.FOLLOWER,
        ECommonVisibility.PRIVATE,
      ];
    } else {
      isFollowingAuthor = await this.followRepo.exists(viewerId, authorId);
      visibilities = isFollowingAuthor
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

    const activePosts = result.posts.filter((post) => post.isActive());

    // Batch check like/save status + populate media
    const postIds = activePosts.map((p) => p.id!);
    const [likedPostIds, savedPostIds, mediaDisplayMap] = await Promise.all([
      this.likeRepo.findLikedPostIds(viewerId, postIds),
      this.saveRepo.findSavedPostIds(viewerId, postIds),
      batchResolveMediaDisplays(
        activePosts.map((p) => ({ id: p.id!, mediaIds: p.mediaIds })),
        this.storageSvc,
        (ids) => this.mediaRepo.findByIds(ids),
      ),
    ]);

    const posts = activePosts.map((post) => {
      const isLiked = likedPostIds.has(post.id!);
      const isSaved = savedPostIds.has(post.id!);

      return PostMapper.toResponseDTO(
        post,
        authorMapped,
        mediaDisplayMap.get(post.id!) ?? [],
        ViewerContextBuilder.buildPost({
          viewerId,
          postAuthorId: post.authorId,
          postSettings: post.data.settings,
          isLiked,
          isSaved,
          isFollowingAuthor,
          isBlocked: false,
        }),
      );
    });

    return new Response.SuccessResponse({
      message: "Posts retrieved successfully",
      data: {
        posts,
        nextCursor: result.nextCursor,
      },
    });
  }
}
