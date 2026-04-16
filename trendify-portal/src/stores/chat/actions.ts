import { createAsyncThunk } from "@reduxjs/toolkit";

import * as api from "./api";
import { EChatActions, IGetConversationsParams, IGetMessagesParams, ISendMessageParams } from "./constants";

export const getConversationsAction = createAsyncThunk(
  EChatActions.GET_CONVERSATIONS,
  async (params: IGetConversationsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await api.getConversations(params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const getMessagesAction = createAsyncThunk(
  EChatActions.GET_MESSAGES,
  async (
    { conversationId, ...params }: IGetMessagesParams & { conversationId: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await api.getMessages(conversationId, params);
      return { conversationId, ...response.data.data };
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const sendMessageAction = createAsyncThunk(
  EChatActions.SEND_MESSAGE,
  async (data: ISendMessageParams, { rejectWithValue }) => {
    try {
      const response = await api.sendMessage(data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
