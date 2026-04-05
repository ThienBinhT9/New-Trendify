import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  INotificationItem,
  INotificationState,
  INotificationTabData,
} from "@/stores/notification/constants";
import * as actions from "./actions";

const initialTabData: INotificationTabData = {
  items: [],
  cursor: null,
  hasNext: false,
};

const initialState: INotificationState = {
  all: { ...initialTabData },
  unread: { ...initialTabData },
  unreadCount: 0,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setUnreadCount: (state, action: PayloadAction<number>) => {
      state.unreadCount = Math.max(0, action.payload || 0);
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    decrementUnreadCount: (state) => {
      state.unreadCount = Math.max(0, state.unreadCount - 1);
    },
    upsertNotificationItem: (state, action: PayloadAction<INotificationItem>) => {
      // Upsert to "all" tab
      const indexAll = state.all.items.findIndex((item) => item.id === action.payload.id);
      if (indexAll >= 0) {
        state.all.items[indexAll] = action.payload;
      } else {
        state.all.items.unshift(action.payload);
      }

      // Upsert to "unread" tab if it's unread
      if (!action.payload.isRead) {
        const indexUnread = state.unread.items.findIndex((item) => item.id === action.payload.id);
        if (indexUnread >= 0) {
          state.unread.items[indexUnread] = action.payload;
        } else {
          state.unread.items.unshift(action.payload);
        }
      } else {
        // If it was in "unread", remove it
        state.unread.items = state.unread.items.filter((item) => item.id !== action.payload.id);
      }
    },
    markNotificationAsReadLocal: (state, action: PayloadAction<string>) => {
      // Mark as read in ALL tabs where it exists
      const targetAll = state.all.items.find((item) => item.id === action.payload);
      if (targetAll) {
        targetAll.isRead = true;
      }

      // Remove from "unread" list entirely
      state.unread.items = state.unread.items.filter((item) => item.id !== action.payload);
    },
  },
  extraReducers(builder) {
    builder.addCase(actions.getNotificationsAction.fulfilled, (state, action) => {
      const { items, cursor, hasNext, unreadCount } = action.payload;
      const isFirstPage = !action.meta.arg?.cursor;
      const tab = action.meta.arg?.isRead === false ? "unread" : "all";

      if (isFirstPage) {
        state[tab].items = items;
      } else {
        state[tab].items = [...state[tab].items, ...items];
      }

      state[tab].cursor = cursor;
      state[tab].hasNext = hasNext;
      state.unreadCount = Math.max(0, unreadCount || 0);
    });

    builder.addCase(actions.getUnreadCountAction.fulfilled, (state, action) => {
      state.unreadCount = Math.max(0, action.payload.unreadCount || 0);
    });

    builder.addCase(actions.markNotificationAsReadAction.fulfilled, (state, action) => {
      state.unreadCount = Math.max(0, action.payload.unreadCount || 0);

      const id = action.payload.notificationId;
      if (id) {
        const targetAll = state.all.items.find((item) => item.id === id);
        if (targetAll) {
          targetAll.isRead = true;
        }
        // Remove from unread items
        state.unread.items = state.unread.items.filter((item) => item.id !== id);
      }
    });

    builder.addCase(actions.markAllNotificationsAsReadAction.fulfilled, (state, action) => {
      state.unreadCount = Math.max(0, action.payload.unreadCount || 0);
      state.all.items = state.all.items.map((item) => ({ ...item, isRead: true }));
      state.unread.items = [];
      state.unread.cursor = null;
      state.unread.hasNext = false;
    });
  },
});

export const {
  setUnreadCount,
  incrementUnreadCount,
  decrementUnreadCount,
  upsertNotificationItem,
  markNotificationAsReadLocal,
} = notificationSlice.actions;

export default notificationSlice;
