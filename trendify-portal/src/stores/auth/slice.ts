import { createSlice } from "@reduxjs/toolkit";

import * as actions from "./actions";
import * as profileActions from "../profile/actions";
import { IAuthState } from "./constants";

const initialState: IAuthState = {
  user: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.user = initialState.user;
      state.isAuthenticated = initialState.isAuthenticated;
    },
  },
  extraReducers(builder) {
    builder
      //sign up complete
      .addCase(actions.signupCompleteAction.fulfilled, (state, action) => {
        const user = action.payload.data.data.user;

        state.user = user ?? initialState.user;
        state.isAuthenticated = true;
      })
      .addCase(actions.signupCompleteAction.rejected, (state) => {
        state.user = initialState.user;
        state.isAuthenticated = false;
      })

      //sign in
      .addCase(actions.signinAction.fulfilled, (state, action) => {
        const user = action.payload.data.data.user;

        state.user = user ?? initialState.user;
        state.isAuthenticated = true;
      })
      .addCase(actions.signinAction.rejected, (state) => {
        state.user = initialState.user;
        state.isAuthenticated = false;
      })

      //sign out
      .addCase(actions.signoutAction.fulfilled, (state) => {
        state.user = initialState.user;
        state.isAuthenticated = false;
      })
      .addCase(actions.signoutAction.rejected, (state) => {
        state.user = initialState.user;
        state.isAuthenticated = false;
      })

      //update profile — only merge text-safe fields;
      // profilePicture/coverPicture come back as raw mediaId strings, not resolved URLs
      .addCase(profileActions.updateProfileAction.fulfilled, (state, action) => {
        if (state.user) {
          const payload = action.payload as unknown as Record<string, unknown>;
          const { profilePicture, coverPicture, password, passwordVersion, ...safeFields } = payload;
          Object.assign(state.user, safeFields);
        }
      })

      // Sync resolved profile data (including picture URLs) from profile re-fetch
      .addCase(profileActions.userProfileAction.fulfilled, (state, action) => {
        const profile = action.payload;
        if (state.user && profile?.viewerContext?.isSelf) {
          state.user = {
            ...state.user,
            firstName: profile.firstName ?? state.user.firstName,
            lastName: profile.lastName ?? state.user.lastName,
            about: profile.about ?? state.user.about,
            profilePicture: profile.profilePicture ?? state.user.profilePicture,
            coverPicture: profile.coverPicture ?? state.user.coverPicture,
          };
        }
      });
  },
});

export const { reset } = authSlice.actions;

export default authSlice;
