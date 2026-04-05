import { createAsyncThunk } from "@reduxjs/toolkit";
import { ESearchActions, ISearchParams, ISearchPostsParams } from "./constants";
import * as api from "./api";

// ============================================================================
// TRENDING
// ============================================================================

export const getTrendingAction = createAsyncThunk(
  ESearchActions.GET_TRENDING,
  async (payload: { limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await api.getTrending(payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

// ============================================================================
// AUTOCOMPLETE
// ============================================================================

export const getAutocompleteAction = createAsyncThunk(
  ESearchActions.GET_AUTOCOMPLETE,
  async (payload: { q: string; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await api.getAutocomplete(payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

// ============================================================================
// SEARCH HISTORY
// ============================================================================

export const getSearchHistoryAction = createAsyncThunk(
  ESearchActions.GET_SEARCH_HISTORY,
  async (payload: { limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await api.getSearchHistory(payload);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const deleteSearchHistoryEntryAction = createAsyncThunk(
  ESearchActions.DELETE_SEARCH_HISTORY_ENTRY,
  async (id: string, { rejectWithValue }) => {
    try {
      await api.deleteSearchHistoryEntry(id);
      return id;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const deleteAllSearchHistoryAction = createAsyncThunk(
  ESearchActions.DELETE_ALL_SEARCH_HISTORY,
  async (_, { rejectWithValue }) => {
    try {
      await api.deleteAllSearchHistory();
      return true;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

// ============================================================================
// SEARCH
// ============================================================================

export const searchUsersAction = createAsyncThunk(
  ESearchActions.SEARCH_USERS,
  async (payload: { params: ISearchParams }, { rejectWithValue }) => {
    try {
      const response = await api.searchUsers(payload.params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const searchPostsAction = createAsyncThunk(
  ESearchActions.SEARCH_POSTS,
  async (payload: { params: ISearchPostsParams }, { rejectWithValue }) => {
    try {
      const response = await api.searchPosts(payload.params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);

export const searchHashtagsAction = createAsyncThunk(
  ESearchActions.SEARCH_HASHTAGS,
  async (payload: { params: ISearchParams }, { rejectWithValue }) => {
    try {
      const response = await api.searchHashtags(payload.params);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error);
    }
  },
);
