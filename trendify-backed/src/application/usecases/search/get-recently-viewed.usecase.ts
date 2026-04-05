import { GetRecentlyViewedDTO } from "@/application/dtos/search.dto";
import { IRecentlyViewedRepository, EViewedResourceType } from "@/domain/search";
import { IUserRepository } from "@/domain/user";
import { IPostRepository } from "@/domain/post";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { UserMapper } from "@/application/mappers";
import {
  fetchMediaRecordFromGroups,
  resolveMediaDisplayList,
} from "@/application/mappers/media.mapper";

// ============================================================================
// GET RECENTLY VIEWED USE CASE
// ============================================================================

export class GetRecentlyViewedUseCase {
  constructor(
    private readonly recentlyViewedRepo: IRecentlyViewedRepository,
    private readonly userRepo: IUserRepository,
    private readonly postRepo: IPostRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: GetRecentlyViewedDTO) {
    const { userId, limit = 10, resourceType } = dto;

    const entries = await this.recentlyViewedRepo.findRecentByUser(
      userId,
      limit,
      resourceType,
    );

    if (entries.length === 0) {
      return { recentlyViewed: [] };
    }

    // Separate by type
    const userEntries = entries.filter((e) => e.resourceType === EViewedResourceType.USER);
    const postEntries = entries.filter((e) => e.resourceType === EViewedResourceType.POST);

    // Fetch users
    const userIds = userEntries.map((e) => e.resourceId);
    const users = userIds.length > 0
      ? await this.userRepo.findByIds(userIds)
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    // Fetch posts
    const postIds = postEntries.map((e) => e.resourceId);
    const posts = postIds.length > 0
      ? await this.postRepo.findManyByIds(postIds)
      : [];
    const postMap = new Map(posts.map((p) => [p.id, p]));

    // Resolve media for profile pictures
    const profilePictureIds = users
      .map((u) =>
        typeof u.data.profilePicture === "string" ? u.data.profilePicture : undefined,
      );

    const postMediaIds = posts.flatMap((p) => p.mediaIds);

    const mediaRecord = await fetchMediaRecordFromGroups(
      [profilePictureIds, postMediaIds],
      (ids) => this.mediaRepo.findByIds(ids),
    );

    // Map results
    const recentlyViewed = entries
      .map((entry) => {
        if (entry.resourceType === EViewedResourceType.USER) {
          const user = userMap.get(entry.resourceId);
          if (!user) return null;

          return {
            type: "user" as const,
            viewedAt: entry.viewedAt,
            data: UserMapper.toAuthorDTO(user, mediaRecord, this.storageSvc),
          };
        }

        if (entry.resourceType === EViewedResourceType.POST) {
          const post = postMap.get(entry.resourceId);
          if (!post || !post.isActive()) return null;

          const media = resolveMediaDisplayList(post.mediaIds, mediaRecord, this.storageSvc);

          return {
            type: "post" as const,
            viewedAt: entry.viewedAt,
            data: {
              id: post.id,
              content: post.data.content?.substring(0, 200),
              media: media.slice(0, 1), // Preview only first media
              type: post.data.type,
              createdAt: post.data.createdAt,
            },
          };
        }

        return null;
      })
      .filter(Boolean);

    return { recentlyViewed };
  }
}
