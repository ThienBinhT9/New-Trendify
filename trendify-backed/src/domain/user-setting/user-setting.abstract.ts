import { UserSettingsEntity } from "./user-setting.entity";

export interface IUserSettingsRepository {
  save(setting: UserSettingsEntity): Promise<void>;

  create(setting: UserSettingsEntity): Promise<UserSettingsEntity>;

  update(setting: UserSettingsEntity): Promise<UserSettingsEntity>;

  findByUserId(userId: string): Promise<UserSettingsEntity | null>;
}
