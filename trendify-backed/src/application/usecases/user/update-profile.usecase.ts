import * as Response from "@/shared/responses";

import { UpdateProfileDTO } from "@/application/dtos/user.dto";
import { IUserRepository } from "@/domain/user";
import { IMediaRepository } from "@/domain/media";
import { ICacheService } from "@/application/services/cache.service";
import { IFileStorageService } from "@/application/services/fileStorage.service";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";

export class UpdateProfileUseCase {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly mediaRepo: IMediaRepository,
    private readonly cacheSvc: ICacheService,
    private readonly storageSvc?: IFileStorageService,
  ) {}

  async execute(body: UpdateProfileDTO) {
    const { userId, ...rest } = body;

    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Response.NotFoundError("User not found");
    }

    // Collect old media IDs to delete
    const oldProfileMediaId = rest.profilePicture ? user.data.profilePicture : null;
    const oldCoverMediaId = rest.coverPicture ? user.data.coverPicture : null;

    // Update user with new mediaIds
    user.updateProfile(rest);
    await this.userRepo.save(user);

    await this.invalidateCache(userId);

    // Fire-and-forget: delete old media
    const oldMediaIds = [oldProfileMediaId, oldCoverMediaId].filter((id): id is string => id !== null);
    if (oldMediaIds.length > 0) {
      this.deleteOldMedia(oldMediaIds).catch((err) =>
        console.error("[UpdateProfile] Failed to delete old media:", err),
      );
    }

    return user.toSnapshot();
  }

  private async deleteOldMedia(mediaIds: string[]): Promise<void> {
    // Fetch media entities to get all S3 keys (original + variants)
    const mediaEntities = await Promise.all(
      mediaIds.map((id) => this.mediaRepo.findById(id))
    );

    // Collect all S3 keys: original + variants
    const s3Keys: string[] = [];
    for (const media of mediaEntities) {
      if (media) {
        // Original file
        s3Keys.push(media.key);
        // Variant files (thumbnail, small, medium, large, etc.)
        s3Keys.push(...media.variants.map((v) => v.key));
      }
    }

    // Delete all files from S3
    if (s3Keys.length > 0 && this.storageSvc) {
      await this.storageSvc.deleteFiles(s3Keys);
    }

    // Delete media documents from DB
    await this.mediaRepo.deleteByIds(mediaIds);
  }

  private async invalidateCache(userId: string) {
    const { baseKey } = CacheContextBuilder.userProfile(userId);

    await this.cacheSvc.del(baseKey);
  }
}
