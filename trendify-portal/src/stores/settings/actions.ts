import { createAsyncThunk } from "@reduxjs/toolkit";
import { ESettingActions, IUpdateSettingsRequest } from "./constants";

import * as api from "./api";

export const getUserSettingsAction = createAsyncThunk(
  ESettingActions.GET_SETTINGS,
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getSettings();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const updateUserSettingsAction = createAsyncThunk(
  ESettingActions.UPDATE_SETTINGS,
  async (body: IUpdateSettingsRequest, { rejectWithValue }) => {
    try {
      const response = await api.updateSettings(body);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
