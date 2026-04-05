import { IPictureUrl } from "./user.interface";

export interface INotificationActor {
  id: string;
  username: string;
  displayName: string;
  profilePicture?: IPictureUrl;
  isVerified?: boolean;

  // Backward-compatible optional fields for existing mock data
  firstName?: string;
  lastName?: string;
}
