import { createAsyncThunk } from "@reduxjs/toolkit";
import { EUploadActions, IConfirmUploadRequest, IPresignedRequest } from "./constants";

import * as api from "./api";

export const presignedAction = createAsyncThunk(
  EUploadActions.PRESIGNED,
  async (body: IPresignedRequest, { rejectWithValue }) => {
    try {
      const response = await api.presigned(body);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const confirmUploadAction = createAsyncThunk(
  EUploadActions.CONFIRM_UPLOAD,
  async (body: IConfirmUploadRequest, { rejectWithValue }) => {
    try {
      const response = await api.confirmUpload(body);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
