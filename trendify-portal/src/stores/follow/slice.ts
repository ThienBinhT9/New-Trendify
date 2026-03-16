import { createSlice } from "@reduxjs/toolkit";

import { IFollowState } from "./constants";
import { listFollowersAction, listFollowingAction, listBlockedAction } from "../profile/actions";
import {
  cancelFollowRequestAction,
  followAction,
  removeFollowerAction,
  unfollowAction,
  unblockAction,
} from "./actions";
import { IUserRelationship, IUserViewContext } from "../profile/constants";

const initialState: IFollowState = {
  followers: {
    users: [],
    searchUsers: [],
    cursor: null,
    page: null,
    hasNext: false,
  },
  following: {
    users: [],
    searchUsers: [],
    cursor: null,
    page: null,
    hasNext: false,
  },
  blocked: {
    users: [],
    cursor: null,
    hasNext: false,
  },
};

export const followSlice = createSlice({
  name: "follow",
  initialState,
  reducers: {
    reset: (state) => {
      state.followers = initialState.followers;
      state.following = initialState.following;
      state.blocked = initialState.blocked;
    },
  },
  extraReducers(builder) {
    builder.addCase(listFollowersAction.fulfilled, (state, action) => {
      const { users, cursor, page, hasNext } = action.payload;
      const { query, cursor: argCursor, page: argPage } = action.meta.arg;

      if (query) {
        if (argPage && argPage > 1) {
          state.followers.searchUsers = [...state.followers.searchUsers, ...users];
        } else {
          state.followers.searchUsers = users;
        }
        state.followers.page = page;
      } else {
        if (argCursor) {
          state.followers.users = [...state.followers.users, ...users];
        } else {
          state.followers.users = users;
        }
        state.followers.cursor = cursor;
      }
      state.followers.hasNext = hasNext;
    });

    builder.addCase(listFollowingAction.fulfilled, (state, action) => {
      const { users, cursor, page, hasNext } = action.payload;
      const { query, cursor: argCursor, page: argPage } = action.meta.arg;

      if (query) {
        if (argPage && argPage > 1) {
          state.following.searchUsers = [...state.followers.searchUsers, ...users];
        } else {
          state.following.searchUsers = users;
        }
        state.following.page = page;
      } else {
        if (argCursor) {
          state.following.users = [...state.following.users, ...users];
        } else {
          state.following.users = users;
        }
        state.following.cursor = cursor;
      }

      state.following.hasNext = hasNext;
    });

    const updateViewerContext = (
      state: IFollowState,
      userId: string,
      update: Partial<IUserViewContext>,
    ) => {
      const updateList = (list: IUserRelationship[]) => {
        const item = list.find((u) => u.id === userId);
        if (item?.viewerContext) {
          item.viewerContext = { ...item.viewerContext, ...update };
        }
      };
      updateList(state.followers.users);
      updateList(state.following.users);
    };

    builder.addCase(followAction.fulfilled, (state, action) => {
      const userId = action.meta.arg;
      const viewContextUpdate = action.payload.data.data.viewContext;

      updateViewerContext(state, userId, viewContextUpdate);
    });
    builder.addCase(unfollowAction.fulfilled, (state, action) => {
      const userId = action.meta.arg;
      const viewContextUpdate = action.payload.data.data.viewContext;

      updateViewerContext(state, userId, viewContextUpdate);
    });
    builder.addCase(removeFollowerAction.fulfilled, (state, action) => {
      const userId = action.meta.arg;
      state.followers.users = state.followers.users.filter((u) => u.id !== userId);
    });
    builder.addCase(cancelFollowRequestAction.fulfilled, (state, action) => {
      const userId = action.meta.arg;
      const viewContextUpdate = action.payload.data.data.viewContext;

      updateViewerContext(state, userId, viewContextUpdate);
    });

    builder.addCase(listBlockedAction.fulfilled, (state, action) => {
      console.log({ state, action });

      // const { users, cursor, hasNext } = action.payload;
      // if (argCursor) {
      //   state.blocked.users = [...state.blocked.users, ...users];
      // } else {
      //   state.blocked.users = users;
      // }
      // state.blocked.cursor = cursor;
      // state.blocked.hasNext = hasNext;
    });

    builder.addCase(unblockAction.fulfilled, (state, action) => {
      const userId = action.meta.arg;
      state.blocked.users = state.blocked.users.filter((u) => u.id !== userId);
    });
  },
});

export const { reset } = followSlice.actions;

export default followSlice;
