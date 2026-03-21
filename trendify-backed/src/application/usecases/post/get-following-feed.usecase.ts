import * as Response from "@/shared/responses";
import { GetFollowingFeedDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { IFollowRepository } from "@/domain/follow";
import { IBlockRepository } from "@/domain/block";
import { ILikeRepository } from "@/domain/like";
import { ISaveRepository } from "@/domain/save";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { IUserRepository } from "@/domain/user";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import {
  batchResolveMediaDisplays,
  resolveMediaVariants,
  toMediaRecord,
} from "@/application/mappers/media.mapper";
import { PostMapper, UserMapper } from "@/application/mappers";

export class GetFollowingFeedUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly followRepo: IFollowRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly userRepo: IUserRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetFollowingFeedDTO) {
    const { viewerId, limit = 20, cursor } = dto;

    // Fetch following list and blocked IDs in parallel
    const [followingIds, blockedIds] = await Promise.all([
      this.followRepo.findAllFollowingIds(viewerId),
      this.blockRepo.findBidirectionalBlockedIds(viewerId),
    ]);

    // Exclude any blocked users from the feed
    const blockedSet = new Set(blockedIds);
    const authorIds = followingIds.filter((id) => !blockedSet.has(id));

    if (authorIds.length === 0) {
      return new Response.SuccessResponse({
        message: "Feed retrieved successfully",
        data: { posts: [], nextCursor: undefined },
      });
    }

    const result = await this.postRepo.findFeed({ authorIds, limit, cursor });

    if (result.posts.length === 0) {
      return new Response.SuccessResponse({
        message: "Feed retrieved successfully",
        data: { posts: [], nextCursor: undefined },
      });
    }

    const postIds = result.posts.map((p) => p.id!);

    const [likedPostIds, savedPostIds, mediaDisplayMap] = await Promise.all([
      this.likeRepo.findLikedPostIds(viewerId, postIds),
      this.saveRepo.findSavedPostIds(viewerId, postIds),
      batchResolveMediaDisplays(
        result.posts.map((p) => ({ id: p.id!, mediaIds: p.mediaIds })),
        this.storageSvc,
        (ids) => this.mediaRepo.findByIds(ids),
      ),
    ]);

    // Fetch author info for all posts
    const authorIdsInDb = [...new Set(result.posts.map((p) => p.authorId))];
    const authors = await this.userRepo.findByIds(authorIdsInDb);
    const authorMap = new Map(authors.map((u) => [u.id, u]));

    // Resolve profile pictures
    const avatarMediaIds = authors
      .map((u) => u.data.profilePicture)
      .filter((id): id is string => typeof id === "string");

    const avatarMediaEntities = await this.mediaRepo.findByIds([...new Set(avatarMediaIds)]);
    const avatarRecord = toMediaRecord(avatarMediaEntities);

    const posts = result.posts
      .map((post) => {
        const authorEntity = authorMap.get(post.authorId);
        if (!authorEntity) {
          return null;
        }

        const isLiked = likedPostIds.has(post.id!);
        const isSaved = savedPostIds.has(post.id!);

        const profileMediaId =
          authorEntity.data.profilePicture && typeof authorEntity.data.profilePicture === "string"
            ? authorEntity.data.profilePicture
            : undefined;
        const profilePicture = resolveMediaVariants(profileMediaId, avatarRecord, this.storageSvc);

        const authorMapped = UserMapper.toAuthorDTO(authorEntity, avatarRecord, this.storageSvc);
        const authorWithResolvedProfilePicture = {
          ...authorMapped,
          profilePicture,
        };

        return PostMapper.toResponseDTO(
          post,
          authorWithResolvedProfilePicture,
          mediaDisplayMap.get(post.id!) ?? [],
          ViewerContextBuilder.buildPost({
            viewerId,
            postAuthorId: post.authorId,
            postSettings: post.data.settings,
            isLiked,
            isSaved,
            isFollowingAuthor: true,
            isBlocked: false,
          }),
        );
      })
      .filter(Boolean);

    return new Response.SuccessResponse({
      message: "Feed retrieved successfully",
      data: {
        posts,
        nextCursor: result.nextCursor || null,
      },
    });
  }
}
