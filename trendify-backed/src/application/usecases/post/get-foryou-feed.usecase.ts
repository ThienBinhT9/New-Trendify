import * as Response from "@/shared/responses";
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

interface GetForYouFeedDTO {
  viewerId: string;
  postIds: string[];
  nextCursor?: string | null;
  meta?: Record<string, unknown>;
}

export class GetForYouFeedUseCase {
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

  async execute(dto: GetForYouFeedDTO) {
    const { viewerId, postIds, nextCursor, meta } = dto;

    if (!postIds || postIds.length === 0) {
      return new Response.SuccessResponse({
        message: "ForYou feed retrieved successfully",
        data: { posts: [], nextCursor: null, meta: meta || {} },
      });
    }

    // Fetch posts by IDs
    const postEntities = await this.postRepo.findManyByIds(postIds);

    // Keep AI ranking order — build a map for O(1) lookup
    const postMap = new Map(postEntities.map((p) => [p.id, p]));
    const orderedPosts = postIds
      .map((id) => postMap.get(id))
      .filter((p): p is NonNullable<typeof p> => p != null && p.isActive());

    if (orderedPosts.length === 0) {
      return new Response.SuccessResponse({
        message: "ForYou feed retrieved successfully",
        data: { posts: [], nextCursor: null, meta: meta || {} },
      });
    }

    const orderedPostIds = orderedPosts.map((p) => p.id!);

    // Fetch viewer context data in parallel
    const [likedPostIds, savedPostIds, blockedIds, followingIds, mediaDisplayMap] =
      await Promise.all([
        this.likeRepo.findLikedPostIds(viewerId, orderedPostIds),
        this.saveRepo.findSavedPostIds(viewerId, orderedPostIds),
        this.blockRepo.findBidirectionalBlockedIds(viewerId),
        this.followRepo.findAllFollowingIds(viewerId),
        batchResolveMediaDisplays(
          orderedPosts.map((p) => ({ id: p.id!, mediaIds: p.mediaIds })),
          this.storageSvc,
          (ids) => this.mediaRepo.findByIds(ids),
        ),
      ]);

    const blockedSet = new Set(blockedIds);
    const followingSet = new Set(followingIds);

    // Fetch author info for all posts
    const authorIdsInDb = [...new Set(orderedPosts.map((p) => p.authorId))];
    const authors = await this.userRepo.findByIds(authorIdsInDb);
    const authorMap = new Map(authors.map((u) => [u.id, u]));

    // Resolve profile pictures
    const avatarMediaIds = authors
      .map((u) => u.data.profilePicture)
      .filter((id): id is string => typeof id === "string");

    const avatarMediaEntities = await this.mediaRepo.findByIds([...new Set(avatarMediaIds)]);
    const avatarRecord = toMediaRecord(avatarMediaEntities);

    const posts = orderedPosts
      .map((post) => {
        // Skip blocked users
        if (blockedSet.has(post.authorId)) return null;

        const authorEntity = authorMap.get(post.authorId);
        if (!authorEntity) return null;

        const isLiked = likedPostIds.has(post.id!);
        const isSaved = savedPostIds.has(post.id!);
        const isFollowingAuthor = followingSet.has(post.authorId);

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
            isFollowingAuthor,
            isBlocked: false,
          }),
        );
      })
      .filter(Boolean);

    return new Response.SuccessResponse({
      message: "ForYou feed retrieved successfully",
      data: {
        posts,
        nextCursor: nextCursor || null,
        meta: meta || {},
      },
    });
  }
}
