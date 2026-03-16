import { ECommonVisibility } from "@/domain/user-setting";
import { EUserGender } from "@/domain/user";

export interface MyProfileDTO {
  userId: string;
}

export interface PublicProfileDTO {
  userId: string;
  viewerId: string;
}

export interface UpdateProfileDTO {
  userId: string;

  firstName?: string;
  lastName?: string;
  about?: string;
  gender?: EUserGender;
  dateOfBirth?: Date;
  profilePicture?: string;  // Media ID
  coverPicture?: string;    // Media ID
}

export interface GetSettingsDTO {
  userId: string;
}

export interface UpdateSettingsDTO {
  userId: string;

  // Profile visibility
  profileVisibility?: ECommonVisibility;

  // Interaction settings
  allowFollowRequests?: boolean;
  allowTagging?: boolean;
  allowCommentOnProfile?: boolean;
  allowMessage?: boolean;

  // Presence settings
  showOnlineStatus?: boolean;
  showLastActiveTime?: boolean;
}
