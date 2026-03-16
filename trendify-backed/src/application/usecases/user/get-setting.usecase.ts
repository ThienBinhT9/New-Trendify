import { GetSettingsDTO } from "@/application/dtos/user.dto";
import { ICacheService } from "@/application/services";
import {
  IUserSettingsProps,
  IUserSettingsRepository,
  UserSettingsEntity,
} from "@/domain/user-setting";
import { CacheContextBuilder } from "@/application/policies/cache-context.builder";

export class GetSettingsUseCase {
  constructor(
    private readonly settingRepo: IUserSettingsRepository,
    private readonly cacheSvc: ICacheService,
  ) {}

  async execute(dto: GetSettingsDTO) {
    const { userId } = dto;
    const { settingKey, settingTtl } = CacheContextBuilder.userProfile(userId);

    // Step 1: Try to get from cache
    const cached = await this.cacheSvc.get<IUserSettingsProps>(settingKey);
    if (cached) return cached;

    // Step 2: Get from database
    let settings = await this.settingRepo.findByUserId(userId);

    // Step 3: Create default settings if not exists
    if (!settings) {
      settings = UserSettingsEntity.create(userId);
      await this.settingRepo.create(settings);
    }

    // Step 4: Format and cache response
    await this.cacheSvc.set(settingKey, settings.data, settingTtl);

    return settings.data;
  }
}
