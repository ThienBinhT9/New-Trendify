import * as Response from "@/shared/responses";

import { PublicProfileDTO } from "@/application/dtos/user.dto";
import { IUserBaseCache, IUserRepository } from "@/domain/user";
import { ICacheService } from "@/application/services";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { IMediaRepository, MediaEntity } from "@/domain/media";
import { ViewerContextBuilder } from "@/application/policies/viewer-context.builder";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";
import { IFollowRepository } from "@/domain/follow";
import { IBlockRepository } from "@/domain/block";

export class UserProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly followRepo: IFollowRepository,
    private readonly blockRepo: IBlockRepository,
    private readonly cacheSvc: ICacheService,
    private readonly storageSvc?: IFileStorageService,
  ) {}

  async execute(body: PublicProfileDTO) {
    const { userId, viewerId } = body;

    const [relationship, isBlocked] = await Promise.all([
      this.followRepo.getRelationship(viewerId, userId),
      this.blockRepo.isEitherBlocked(viewerId, userId),
    ]);

    if (isBlocked) {
      throw new Response.NotFoundError("User not found");
    }

    const { isFollowing, isFollowedBy, isRequested, isRequestedByThem } = relationship;

    const viewerContext = ViewerContextBuilder.buildUser({
      viewerId,
      targetId: userId,
      isFollowing,
      isRequested,
      isFollowedBy,
      isRequestedByThem,
    });

    // const { baseKey, baseTtl, statsKey, statsFields } = CacheContextBuilder.userProfile(userId);

    // const [cachedBase, cachedStatsHash] = await Promise.all([
    //   this.cacheSvc.get<IUserBaseCache>(baseKey),
    //   this.cacheSvc.hGetAll(statsKey),
    // ]);

    // let cachedStats: IUserStatsCache | null = null;
    // if (cachedStatsHash && Object.keys(cachedStatsHash).length > 0) {
    //   cachedStats = {
    //     followerCount: parseInt(cachedStatsHash[statsFields.followers] || "0", 10),
    //     followingCount: parseInt(cachedStatsHash[statsFields.following] || "0", 10),
    //     postCount: parseInt(cachedStatsHash[statsFields.posts] || "0", 10),
    //   };
    // }

    // if (cachedBase && cachedStats) {
    //   return { ...cachedBase, ...cachedStats, viewerContext };
    // }

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Response.NotFoundError("User not found");
    }

    const userBase = user.toBaseInfo();
    const userStats = user.toStatsInfo();

    // Resolve mediaIds to public URLs
    await this.resolveProfilePictures(userBase);

    // await Promise.all(
    //   [
    //     !cachedBase && this.cacheSvc.set(baseKey, userBase, baseTtl),
    //     !cachedStats && this.initStatsCounters(userId, userStats),
    //   ].filter(Boolean),
    // );

    return { ...userBase, ...userStats, viewerContext };
  }

  // private async initStatsCounters(userId: string, stats: IUserStatsCache): Promise<void> {
  //   const { statsKey, statsFields, statsTtl } = CacheContextBuilder.userProfile(userId);

  //   const results = await Promise.all([
  //     this.cacheSvc.hSetNX(statsKey, statsFields.followers, stats.followerCount),
  //     this.cacheSvc.hSetNX(statsKey, statsFields.following, stats.followingCount),
  //     this.cacheSvc.hSetNX(statsKey, statsFields.posts, stats.postCount),
  //   ]);

  //   const anyFieldSet = results.some((r) => r === true);
  //   if (anyFieldSet) {
  //     await this.cacheSvc.expire(statsKey, statsTtl);
  //   }
  // }

  /**
   * Resolve mediaIds to public URLs with all variants for profilePicture and coverPicture.
   */
  private async resolveProfilePictures(userBase: IUserBaseCache): Promise<void> {
    if (!this.storageSvc || !this.mediaRepo) return;

    // Resolve profilePicture (only if it's still a mediaId string)
    if (userBase.profilePicture && typeof userBase.profilePicture === "string") {
      const media = await this.mediaRepo.findById(userBase.profilePicture);
      if (media) {
        userBase.profilePicture = this.mapVariantsToUrls(media);
      } else {
        userBase.profilePicture = undefined;
      }
    }

    // Resolve coverPicture (only if it's still a mediaId string)
    if (userBase.coverPicture && typeof userBase.coverPicture === "string") {
      const media = await this.mediaRepo.findById(userBase.coverPicture);
      if (media) {
        userBase.coverPicture = this.mapVariantsToUrls(media);
      } else {
        userBase.coverPicture = undefined;
      }
    }
  }

  /**
   * Map media variants to URLs object { [variantType]: url }
   */
  private mapVariantsToUrls(media: MediaEntity): Record<string, string> {
    const variantMap: Record<string, string> = {};

    // Original file
    variantMap["original"] = this.storageSvc!.getPublicUrl(media.key);

    // All variants
    media.variants.forEach((variant) => {
      variantMap[variant.type] = this.storageSvc!.getPublicUrl(variant.key);
    });

    return variantMap;
  }
}
