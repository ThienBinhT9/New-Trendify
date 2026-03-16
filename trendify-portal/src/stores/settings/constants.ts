import { IApiResponse } from "@/interfaces/api.interface";
import { EVisibility } from "@/interfaces/common.interface";
import { IUserSettings } from "@/interfaces/setting.interface";

export enum ESettingActions {
  GET_SETTINGS = "GET_SETTINGS",
  UPDATE_SETTINGS = "UPDATE_SETTINGS",
}

export const SETTINGS_ENPOINT = {
  GET_SETTINGS: "/users/me/settings",
  UPDATE_SETTINGS: "/users/me/settings",
};

//============= REQUEST =============
export interface IUpdateSettingsRequest {
  profileVisibility?: EVisibility;

  allowTagging?: boolean;
  allowCommentOnProfile?: boolean;

  showOnlineStatus?: boolean;
  showLastActiveTime?: boolean;
}

//============= RESPONSE =============
export interface IGetSettingsResponse extends IApiResponse {
  data: IUserSettings;
}

export interface IUpdateSettingsResponse extends IApiResponse {
  data: IUserSettings;
}

export interface ISettingsState {
  userSettings: IUserSettings | null;
}
