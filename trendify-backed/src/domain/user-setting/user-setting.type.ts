export enum ECommonVisibility {
  PUBLIC = "public",
  PRIVATE = "private",
  FOLLOWER = "follower",
}

export interface IUserSettingsProps {
  userId: string;

  profileVisibility: ECommonVisibility;

  // Interaction Settings
  allowFollow: boolean;
  allowTagging: boolean;
  allowCommentOnProfile: boolean; // NEW: Cho phép comment trên profile
  allowMessage: boolean; // NEW: Cho phép nhắn tin riêng tư

  showOnlineStatus: boolean;
  showLastActiveTime: boolean; // NEW: Hiển thị lần active lần cuối

  createdAt: Date;
  updatedAt: Date;
}
