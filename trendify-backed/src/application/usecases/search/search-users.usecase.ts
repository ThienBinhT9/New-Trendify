import * as Response from "@/shared/responses";
import { SearchUsersDTO } from "@/application/dtos/search.dto";
import { IUserRepository } from "@/domain/user";
import { IBlockRepository } from "@/domain/block";
import { IFollowRepository } from "@/domain/follow";
import { IMediaRepository } from "@/domain/media";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { UserMapper } from "@/application/mappers";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import {
  fetchMediaRecordFromGroups,
} from "@/application/mappers/media.mapper";

// ============================================================================
// SEARCH USERS USE CASE
// ============================================================================

export class SearchUsersUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly followRepo: IFollowRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly storageSvc: IFileStorageService,
  ) {}

  async execute(dto: SearchUsersDTO) {
    const { query, viewerId, limit = 10, cursor } = dto;

    if (!query || query.trim().length === 0) {
      throw new Response.BadRequestError("Search query is required");
    }

    const trimmedQuery = query.trim();

    // Text search trên users (firstName, lastName, username)
    const { users, nextCursor } = await this.userRepo.searchUsers(trimmedQuery, {
      limit,
      cursor,
    });

    if (users.length === 0) {
      return {
        users: [],
        nextCursor: undefined,
        resultCount: 0,
      };
    }

    // Filter: loại bỏ blocked users
    const userIds = users
      .map((u) => u.id)
      .filter((id): id is string => id !== undefined);

    const blockedSet = new Set<string>();
    await Promise.all(
      userIds.map(async (uid) => {
        const isBlocked = await this.blockRepo.isEitherBlocked(viewerId, uid);
        if (isBlocked) blockedSet.add(uid);
      }),
    );

    const filteredUsers = users.filter(
      (u) => u.id && !blockedSet.has(u.id),
    );

    const filteredUserIds = filteredUsers
      .map((u) => u.id)
      .filter((id): id is string => id !== undefined);

    // Batch fetch follow data (following + pending) + followedBy
    const [followData, followerIds] = await Promise.all([
      this.followRepo.findUserFollowData(viewerId, filteredUserIds),
      this.followRepo.findFollowedIds(viewerId, filteredUserIds),
    ]);

    // Resolve profile pictures
    const profilePictureIds = filteredUsers
      .map((u) =>
        typeof u.data.profilePicture === "string" ? u.data.profilePicture : undefined,
      );

    const mediaRecord = await fetchMediaRecordFromGroups(
      [profilePictureIds],
      (ids) => this.mediaRepo.findByIds(ids),
    );

    const mappedUsers = filteredUsers.map((user) => ({
      ...UserMapper.toAuthorDTO(user, mediaRecord, this.storageSvc),
      viewerContext: ViewerContextBuilder.buildUser({
        viewerId,
        targetId: user.id!,
        isFollowing: followData.followingIds.has(user.id!),
        isRequested: followData.pendingRequestIds.has(user.id!),
        isFollowedBy: followerIds.has(user.id!),
      }),
    }));

    return {
      users: mappedUsers,
      nextCursor,
      resultCount: mappedUsers.length,
    };
  }
}
