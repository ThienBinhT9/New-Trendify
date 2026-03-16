export interface ILayout {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  header?: React.ReactNode;
}

export enum EVisibility {
  public = "public",
  private = "private",
}

export interface TokenStorage {
  accessToken: string;
}

export enum EStorageContants {
  ACCESS_TOKEN = "accessToken",
  REFRESH_TOKEN = "refreshToken",
  EMAIL_VERIFIED = "emailVerified",
  DEVICE_ID = "deviceId",
  THEME_MODE = "theme",
}

export enum EThemeMode {
  LIGHT = "light",
  DARK = "dark",
  AUTO = "auto",
}

export interface IListParams {
  cursor?: string | null;
  limit?: number;
  query?: string;
  page?: number;
}

export enum EMediaPurpose {
  PROFILE_PICTURE = "profile-picture",
  COVER_PICTURE = "cover-picture",
}
