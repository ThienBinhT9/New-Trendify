import { createAsyncThunk } from "@reduxjs/toolkit";

import * as api from "./api";
import { ENotificationActions, IGetNotificationsParams } from "./constants";

export const getNotificationsAction = createAsyncThunk(
  ENotificationActions.GET_NOTIFICATIONS,
  async (params: IGetNotificationsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await api.getNotifications(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getUnreadCountAction = createAsyncThunk(
  ENotificationActions.GET_UNREAD_COUNT,
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getUnreadCount();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const markNotificationAsReadAction = createAsyncThunk(
  ENotificationActions.MARK_AS_READ,
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await api.markAsRead(notificationId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const markAllNotificationsAsReadAction = createAsyncThunk(
  ENotificationActions.MARK_ALL_AS_READ,
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.markAllAsRead();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
