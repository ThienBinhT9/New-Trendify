import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { INotificationItem, INotificationState } from "@/stores/notification/constants";
import * as actions from "./actions";

const initialState: INotificationState = {
  items: [],
  unreadCount: 0,
  cursor: null,
  hasNext: false,
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
      const index = state.items.findIndex((item) => item.id === action.payload.id);

      if (index >= 0) {
        state.items[index] = action.payload;
        return;
      }

      state.items.unshift(action.payload);
    },
    markNotificationAsReadLocal: (state, action: PayloadAction<string>) => {
      const target = state.items.find((item) => item.id === action.payload);
      if (target) {
        target.isRead = true;
      }
    },
  },
  extraReducers(builder) {
    builder.addCase(actions.getNotificationsAction.fulfilled, (state, action) => {
      const { items, cursor, hasNext, unreadCount } = action.payload;
      const isFirstPage = !action.meta.arg?.cursor;

      if (isFirstPage) {
        state.items = items;
      } else {
        state.items = [...state.items, ...items];
      }

      state.cursor = cursor;
      state.hasNext = hasNext;
      state.unreadCount = Math.max(0, unreadCount || 0);
    });

    builder.addCase(actions.getUnreadCountAction.fulfilled, (state, action) => {
      state.unreadCount = Math.max(0, action.payload.unreadCount || 0);
    });

    builder.addCase(actions.markNotificationAsReadAction.fulfilled, (state, action) => {
      state.unreadCount = Math.max(0, action.payload.unreadCount || 0);

      if (action.payload.notificationId) {
        const target = state.items.find((item) => item.id === action.payload.notificationId);
        if (target) {
          target.isRead = true;
        }
      }
    });

    builder.addCase(actions.markAllNotificationsAsReadAction.fulfilled, (state, action) => {
      state.unreadCount = Math.max(0, action.payload.unreadCount || 0);
      state.items = state.items.map((item) => ({ ...item, isRead: true }));
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
