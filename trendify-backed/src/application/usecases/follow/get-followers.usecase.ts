import * as Response from "@/shared/responses";

import { GetFollowersDTO } from "@/application/dtos/follow.dto";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { ICacheService } from "@/application/services/cache.service";
import { IFollowRepository } from "@/domain/follow";
import { IUserRepository } from "@/domain/user/user.abstract";
import { IMediaRepository, MediaEntity } from "@/domain/media";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";

export class GetFollowersUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly followRepo: IFollowRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc?: IFileStorageService,
    private readonly cacheService?: ICacheService,
  ) {}

  async execute(dto: GetFollowersDTO) {
    const { viewerId, userId, cursor, query, limit = 20, page = 1 } = dto;

    const isSearchMode = query && query.trim().length > 0;

    if (isSearchMode) {
      const result = await this.followRepo.searchFollowers(userId, query.trim(), limit, page);
      if (result.userIds.length === 0) {
        return new Response.SuccessResponse({ data: { users: [], page, hasNext: false } });
      }
      const users = await this.buildUserList(viewerId, result.userIds);
      return new Response.SuccessResponse({ data: { users, page, hasNext: result.hasNext } });
    }

    const result = await this.followRepo.findFollowers(userId, limit, cursor);
    if (result.userIds.length === 0) {
      return new Response.SuccessResponse({ data: { users: [], cursor: null, hasNext: false } });
    }

    const users = await this.buildUserList(viewerId, result.userIds);
    const payload = { users, cursor: result.nextCursor ?? null, hasNext: !!result.nextCursor };

    return new Response.SuccessResponse({ data: payload });
  }

  private async buildUserList(viewerId: string, userIds: string[]) {
    const [users, followerIds, followData] = await Promise.all([
      this.userRepo.findByIds(userIds, {
        fields: ["username", "firstName", "lastName", "profilePicture", "isVerified"],
      }),
      this.followRepo.findFollowedIds(viewerId, userIds),
      this.followRepo.findUserFollowData(viewerId, userIds),
    ]);

    // Batch-fetch all profile picture media in one query
    const profilePictureIds = users
      .map((u) => u.data.profilePicture)
      .filter((id): id is string => !!id);

    const mediaMap = await this.batchResolveProfilePictures(profilePictureIds);

    return users.map((user) => ({
      id: user.id,
      firstName: user.data.firstName,
      lastName: user.data.lastName,
      username: user.data.username,
      isVerified: user.data.isVerified,
      profilePicture: user.data.profilePicture
        ? (mediaMap.get(user.data.profilePicture) ?? null)
        : null,
      viewerContext: ViewerContextBuilder.buildUser({
        viewerId,
        targetId: user.id!,
        isFollowing: followData.followingIds.has(user.id!),
        isRequested: followData.pendingRequestIds.has(user.id!),
        isFollowedBy: followerIds.has(user.id!),
      }),
    }));
  }

  private async batchResolveProfilePictures(ids: string[]) {
    const result = new Map<string, Record<string, string>>();
    if (!ids.length || !this.storageSvc) return result;

    const mediaList = await this.mediaRepo.findByIds(ids);
    for (const media of mediaList) {
      if (media.id) {
        result.set(media.id, this.mapVariantsToUrls(media));
      }
    }
    return result;
  }

  private mapVariantsToUrls(media: MediaEntity): Record<string, string> {
    const variantMap: Record<string, string> = {};
    variantMap["original"] = this.storageSvc!.getPublicUrl(media.key);
    media.variants.forEach((variant) => {
      variantMap[variant.type] = this.storageSvc!.getPublicUrl(variant.key);
    });
    return variantMap;
  }
}
