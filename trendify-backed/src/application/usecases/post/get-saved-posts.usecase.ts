import * as Response from "@/shared/responses";
import { GetSavedPostsDTO } from "@/application/dtos/post.dto";
import { IPostRepository } from "@/domain/post";
import { ISaveRepository } from "@/domain/save";
import { ILikeRepository } from "@/domain/like";
import { IFollowRepository } from "@/domain/follow";
import { IBlockRepository } from "@/domain/block";
import { IUserRepository } from "@/domain/user";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import {
  batchResolveMediaDisplays,
  resolveMediaVariants,
  toMediaRecord,
} from "@/application/mappers/media.mapper";
import { PostMapper, UserMapper } from "@/application/mappers";

export class GetSavedPostsUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly userRepo: IUserRepository,
    private readonly followRepo: IFollowRepository,
    private readonly blockRepo: IBlockRepository,
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
    const authorIds = [...new Set(activePosts.map((p) => p.authorId))];

    const [likedPostIds, mediaDisplayMap, authors, followingIds, blockedIds] = await Promise.all([
      this.likeRepo.findLikedPostIds(userId, postIds),
      batchResolveMediaDisplays(
        activePosts.map((p) => ({ id: p.id!, mediaIds: p.mediaIds })),
        this.storageSvc,
        (ids) => this.mediaRepo.findByIds(ids),
      ),
      this.userRepo.findByIds(authorIds),
      this.followRepo.findFollowingIds(userId, authorIds),
      this.blockRepo.findBidirectionalBlockedIds(userId),
    ]);

    const blockedSet = new Set(blockedIds);
    const authorMap = new Map(authors.map((u) => [u.id, u]));

    const avatarMediaIds = authors
      .map((u) => u.data.profilePicture)
      .filter((id): id is string => typeof id === "string");

    const avatarMediaEntities = await this.mediaRepo.findByIds([...new Set(avatarMediaIds)]);
    const avatarRecord = toMediaRecord(avatarMediaEntities);

    // Maintain save order (newest saved first)
    const orderedPosts = result.saves
      .map((save) => {
        const post = postMap.get(save.postId);
        if (!post || post.isDeleted()) return null;

        const author = authorMap.get(post.authorId);
        if (!author) return null;

        const profileMediaId =
          author.data.profilePicture && typeof author.data.profilePicture === "string"
            ? author.data.profilePicture
            : undefined;
        const profilePicture = resolveMediaVariants(profileMediaId, avatarRecord, this.storageSvc);

        const isLiked = likedPostIds.has(post.id!);
        const isSaved = true;

        const authorMapped = UserMapper.toAuthorDTO(author, avatarRecord, this.storageSvc);
        const authorWithResolvedProfilePicture = {
          ...authorMapped,
          profilePicture,
        };

        return PostMapper.toResponseDTO(
          post,
          authorWithResolvedProfilePicture,
          mediaDisplayMap.get(post.id!) ?? [],
          ViewerContextBuilder.buildPost({
            viewerId: userId,
            postAuthorId: post.authorId,
            postSettings: post.data.settings,
            isLiked,
            isSaved,
            isFollowingAuthor: followingIds.has(post.authorId),
            isBlocked: blockedSet.has(post.authorId),
          }),
        );
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
