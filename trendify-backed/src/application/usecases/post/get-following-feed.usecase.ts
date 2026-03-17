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
import { batchPopulateMedia } from "./media-display.mapper";

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
      batchPopulateMedia(
        result.posts.map((p) => ({ id: p.id!, mediaIds: p.mediaIds })),
        this.storageSvc,
        (ids) => this.mediaRepo.findByIds(ids),
      ),
    ]);

    // Fetch author info for all posts
    const authorIdsInDb = [...new Set(result.posts.map((p) => p.authorId))];
    const authors = await this.userRepo.findByIds(authorIdsInDb);
    const authorMap = new Map(authors.map((u) => [u.id, u.data]));

    // Resolve profile pictures
    const avatarMediaIds = authors
      .map((u) => u.data.profilePicture)
      .filter((id): id is string => typeof id === "string");

    const avatarMediaEntities = await this.mediaRepo.findByIds([...new Set(avatarMediaIds)]);
    const avatarMap = new Map(avatarMediaEntities.map((m) => [m.id, m]));

    const posts = result.posts.map((post) => {
      const authorProp = authorMap.get(post.authorId);
      let profilePictureUrl: string | undefined = undefined;

      if (authorProp?.profilePicture && typeof authorProp.profilePicture === "string") {
        const media = avatarMap.get(authorProp.profilePicture);
        if (media) {
          const smallVariant = media.variants.find((v) => v.type === "small");
          const key = smallVariant ? smallVariant.key : media.key;
          profilePictureUrl = this.storageSvc.getPublicUrl(key);
        }
      }

      return {
        ...post.toSnapshot(),
        author: {
          id: post.authorId,
          username: authorProp?.username,
          firstName: authorProp?.firstName,
          lastName: authorProp?.lastName,
          profilePicture: profilePictureUrl,
        },
        media: mediaDisplayMap.get(post.id!) ?? [],
        isLiked: likedPostIds.has(post.id!),
        isSaved: savedPostIds.has(post.id!),
      };
    });

    return new Response.SuccessResponse({
      message: "Feed retrieved successfully",
      data: {
        posts,
        nextCursor: result.nextCursor || null,
      },
    });
  }
}
