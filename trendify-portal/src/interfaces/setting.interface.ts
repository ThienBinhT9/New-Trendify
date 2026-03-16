import { EVisibility } from "./common.interface";

export interface IUserSettings {
  userId: string;

  profileVisibility: EVisibility;

  allowFollow: boolean;
  allowTagging: boolean;
  allowCommentOnProfile: boolean;
  allowMessage: boolean;

  showOnlineStatus: boolean;
  showLastActiveTime: boolean;

  createdAt: Date;
  updatedAt: Date;
}
