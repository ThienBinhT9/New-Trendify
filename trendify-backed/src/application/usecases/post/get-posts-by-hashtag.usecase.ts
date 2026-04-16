import * as Response from "@/shared/responses";
import { IPostRepository } from "@/domain/post";
import { IUserRepository } from "@/domain/user";
import { IBlockRepository } from "@/domain/block";
import { ILikeRepository } from "@/domain/like";
import { ISaveRepository } from "@/domain/save";
import { IFollowRepository } from "@/domain/follow";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { PostMapper, UserMapper } from "@/application/mappers";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import {
  fetchMediaRecordFromGroups,
  resolveMediaDisplayList,
} from "@/application/mappers/media.mapper";

// ============================================================================
// GET POSTS BY HASHTAG USE CASE
// ============================================================================

interface GetPostsByHashtagDTO {
  viewerId: string;
  hashtag: string;
  limit?: number;
  cursor?: string;
}

export class GetPostsByHashtagUseCase {
  constructor(
    private readonly postRepo: IPostRepository,
    private readonly userRepo: IUserRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly likeRepo: ILikeRepository,
    private readonly saveRepo: ISaveRepository,
    private readonly followRepo: IFollowRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetPostsByHashtagDTO) {
    const { viewerId, hashtag, limit = 10, cursor } = dto;

    if (!hashtag || hashtag.trim().length === 0) {
      throw new Response.BadRequestError("Hashtag is required");
    }

    // Normalize: remove # prefix, lowercase
    const normalizedHashtag = hashtag.trim().toLowerCase().replace(/^#/, "");

    // Query posts by hashtag
    const { posts, nextCursor } = await this.postRepo.findByHashtag({
      hashtag: normalizedHashtag,
      limit,
      cursor,
    });

    if (posts.length === 0) {
      return new Response.SuccessResponse({
        data: {
          posts: [],
          hashtag: normalizedHashtag,
          nextCursor: undefined,
        },
      });
    }

    // Filter: loại bỏ posts từ blocked authors
    const authorIds = [...new Set(posts.map((p) => p.authorId))];
    const blockedSet = new Set<string>();
    await Promise.all(
      authorIds.map(async (authorId) => {
        const isBlocked = await this.blockRepo.isEitherBlocked(viewerId, authorId);
        if (isBlocked) blockedSet.add(authorId);
      }),
    );

    const filteredPosts = posts.filter((p) => !blockedSet.has(p.authorId));

    // Fetch authors
    const uniqueAuthorIds = [...new Set(filteredPosts.map((p) => p.authorId))];
    const authors = await this.userRepo.findByIds(uniqueAuthorIds);
    const authorMap = new Map(authors.map((a) => [a.id, a]));

    // Check like/save status + follow status
    const enrichments = await Promise.all(
      filteredPosts.map(async (post) => {
        const [isLiked, isSaved, isFollowingAuthor] = await Promise.all([
          this.likeRepo.exists(viewerId, post.id!),
          this.saveRepo.exists(viewerId, post.id!),
          viewerId !== post.authorId
            ? this.followRepo.exists(viewerId, post.authorId)
            : Promise.resolve(false),
        ]);
        return { isLiked, isSaved, isFollowingAuthor };
      }),
    );

    // Resolve media
    const allMediaIds = filteredPosts.flatMap((p) => p.mediaIds);
    const profilePictureIds = uniqueAuthorIds.map((id) => {
      const author = authorMap.get(id);
      return typeof author?.data.profilePicture === "string"
        ? author.data.profilePicture
        : undefined;
    });

    const mediaRecord = await fetchMediaRecordFromGroups(
      [allMediaIds, profilePictureIds],
      (ids) => this.mediaRepo.findByIds(ids),
    );

    // Map results
    const mappedPosts = filteredPosts
      .map((post, index) => {
        const author = authorMap.get(post.authorId);
        if (!author) return null;

        const { isLiked, isSaved, isFollowingAuthor } = enrichments[index];

        const viewerContext = ViewerContextBuilder.buildPost({
          viewerId,
          postAuthorId: post.authorId,
          postSettings: post.data.settings,
          isLiked,
          isSaved,
          isFollowingAuthor,
        });

        const media = resolveMediaDisplayList(post.mediaIds, mediaRecord, this.storageSvc);
        const authorMapped = UserMapper.toAuthorDTO(author, mediaRecord, this.storageSvc);

        return PostMapper.toResponseDTO(post, authorMapped, media, viewerContext);
      })
      .filter(Boolean);

    return new Response.SuccessResponse({
      data: {
        posts: mappedPosts,
        hashtag: normalizedHashtag,
        nextCursor,
      },
    });
  }
}
