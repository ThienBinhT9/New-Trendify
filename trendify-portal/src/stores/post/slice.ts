import { createSlice } from "@reduxjs/toolkit";
import * as actions from "./actions";
import { IProfileState } from "./constants";
import { IApiException } from "@/interfaces/api.interface";
import {
  acceptFollowRequestAction,
  cancelFollowRequestAction,
  followAction,
  rejectFollowRequestAction,
  removeFollowerAction,
  unfollowAction,
} from "../follow/actions";

const initialState: IProfileState = {
  profile: null,
  errorStatus: null,
  isOwnProfile: false,
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    reset: (state) => {
      state.profile = initialState.profile;
      state.isOwnProfile = initialState.isOwnProfile;
    },
  },
  extraReducers(builder) {
    builder
      //User Profile
      .addCase(actions.userProfileAction.pending, (state) => {
        state.profile = initialState.profile;
        state.errorStatus = initialState.errorStatus;
        state.isOwnProfile = initialState.isOwnProfile;
      })
      .addCase(actions.userProfileAction.fulfilled, (state, action) => {
        state.profile = action.payload;
        state.errorStatus = initialState.errorStatus;
        state.isOwnProfile = action.payload?.viewerContext?.isSelf || initialState.isOwnProfile;
      })
      .addCase(actions.userProfileAction.rejected, (state, action) => {
        state.errorStatus = (action.payload as IApiException)?.status || initialState.errorStatus;
        state.profile = initialState.profile;
        state.isOwnProfile = initialState.isOwnProfile;
      })

      .addCase(followAction.fulfilled, (state, action) => {
        const userId = action.meta.arg;
        const viewContext = action.payload.data.data.viewContext;

        if (state.profile?.id === userId) {
          if (state.profile?.viewerContext) {
            state.profile.viewerContext = {
              ...state.profile.viewerContext,
              ...action.payload.data.data.viewContext,
            };
          }

          if (viewContext.isFollowing) {
            state.profile.followerCount += 1;
          }
        }
      })
      .addCase(unfollowAction.fulfilled, (state, action) => {
        const userId = action.meta.arg;
        if (state.profile?.id === userId) {
          if (state.profile?.viewerContext) {
            const wasFollowing = state.profile.viewerContext.isFollowing;

            state.profile.viewerContext = {
              ...state.profile.viewerContext,
              ...action.payload.data.data.viewContext,
            };

            if (wasFollowing) {
              state.profile.followerCount = Math.max(0, state.profile.followerCount - 1);
            }
          }
        }
      })
      .addCase(removeFollowerAction.fulfilled, (state) => {
        if (state.isOwnProfile && state.profile) {
          state.profile.followerCount = Math.max(0, state.profile.followerCount - 1);
        }
      })
      .addCase(cancelFollowRequestAction.fulfilled, (state, action) => {
        const userId = action.meta.arg;
        if (state.profile?.id === userId && state.profile?.viewerContext) {
          state.profile.viewerContext = {
            ...state.profile.viewerContext,
            ...action.payload.data.data.viewContext,
          };
        }
      })
      .addCase(acceptFollowRequestAction.fulfilled, (state, action) => {
        const requesterId = action.meta.arg;

        if (state.profile?.id === requesterId) {
          if (state.profile?.viewerContext) {
            state.profile.viewerContext = {
              ...state.profile.viewerContext,
              ...action.payload.data.data.viewContext,
            };
          }
          state.profile.followingCount += 1;
        }
      })
      .addCase(rejectFollowRequestAction.fulfilled, (state, action) => {
        const requesterId = action.meta.arg;

        if (state.profile?.id === requesterId) {
          if (state.profile?.viewerContext) {
            state.profile.viewerContext = {
              ...state.profile.viewerContext,
              ...action.payload.data.data.viewContext,
            };
          }
        }
      });
  },
});

export const { reset } = profileSlice.actions;

export default profileSlice;
