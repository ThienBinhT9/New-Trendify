import {
  IGetSettingsResponse,
  IUpdateSettingsResponse,
  IUpdateSettingsRequest,
  SETTINGS_ENPOINT,
} from "./constants";

import apiClient from "@/services/api-clients";

export const getSettings = async () => {
  return apiClient.get<IGetSettingsResponse>(SETTINGS_ENPOINT.GET_SETTINGS);
};

export const updateSettings = async (body: IUpdateSettingsRequest) => {
  return apiClient.patch<IUpdateSettingsResponse>(SETTINGS_ENPOINT.UPDATE_SETTINGS, body);
};
