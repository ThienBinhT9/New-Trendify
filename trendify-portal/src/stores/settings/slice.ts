import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ISettingsState } from "./constants";
import * as actions from "./actions";
import * as authActions from "@/stores/auth/actions";
import { IUserSettings } from "@/interfaces/setting.interface";

const initialState: ISettingsState = {
  userSettings: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    reset: (state) => {
      state.userSettings = initialState.userSettings;
    },
    updateUserSettings: (state, action: PayloadAction<Partial<IUserSettings>>) => {
      state.userSettings = { ...state.userSettings, ...action.payload } as IUserSettings;
    },
  },
  extraReducers(builder) {
    //GET SETTINGS
    builder.addCase(actions.getUserSettingsAction.fulfilled, (state, action) => {
      state.userSettings = action.payload;
    });

    builder.addCase(authActions.signinAction.fulfilled, (state, action) => {
      state.userSettings = action.payload.data.data?.settings;
    });

    builder.addCase(authActions.signupCompleteAction.fulfilled, (state, action) => {
      state.userSettings = action.payload.data.data?.settings;
    });

    //UPDATE SETTINGS
    builder.addCase(actions.updateUserSettingsAction.fulfilled, (state, action) => {
      state.userSettings = action.payload;
    });

    //sign out
    builder.addCase(authActions.signoutAction.fulfilled, (state) => {
      state.userSettings = initialState.userSettings;
    });
    builder.addCase(authActions.signoutAction.rejected, (state) => {
      state.userSettings = initialState.userSettings;
    });
  },
});

export const { reset, updateUserSettings } = settingsSlice.actions;
export default settingsSlice;
