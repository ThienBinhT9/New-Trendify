import * as Response from "@/shared/responses";

import { UpdateSettingsDTO } from "@/application/dtos/user.dto";
import { IUserSettingsRepository } from "@/domain/user-setting";
import { ICacheService } from "@/application/services";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";

export class UpdateSettingsUseCase {
  constructor(
    private readonly settingRepo: IUserSettingsRepository,
    private readonly cacheSvc: ICacheService,
  ) {}

  async execute(dto: UpdateSettingsDTO) {
    const { userId, ...updates } = dto;

    // Step 1: Get existing settings
    const settings = await this.settingRepo.findByUserId(userId);
    if (!settings) {
      throw new Response.NotFoundError("User settings not found");
    }

    // Step 3: Apply updates
    settings.changePrivacy(updates);

    // Step 4: Save to database
    await this.settingRepo.save(settings);

    //step 5: Invalidate cache
    await this.invalidateCache(userId);

    return settings.data;
  }

  private async invalidateCache(userId: string) {
    const { settingKey } = CacheContextBuilder.userProfile(userId);

    await this.cacheSvc.del(settingKey);
  }
}
