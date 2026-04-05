import apiClient from "@/services/api-clients";
import {
  SEARCH_ENDPOINT,
  ITrendingResponse,
  IAutocompleteResponse,
  ISearchHistoryResponse,
  IDeleteSearchHistoryResponse,
  ISearchUsersResponse,
  ISearchPostsResponse,
  ISearchHashtagsResponse,
  ISearchParams,
  ISearchPostsParams,
} from "./constants";

// ============================================================================
// TRENDING
// ============================================================================

export const getTrending = async (params?: { limit?: number }) => {
  return apiClient.get<ITrendingResponse>(SEARCH_ENDPOINT.TRENDING, { params });
};

// ============================================================================
// AUTOCOMPLETE
// ============================================================================

export const getAutocomplete = async (params: { q: string; limit?: number }) => {
  return apiClient.get<IAutocompleteResponse>(SEARCH_ENDPOINT.AUTOCOMPLETE, { params });
};

// ============================================================================
// SEARCH HISTORY
// ============================================================================

export const getSearchHistory = async (params?: { limit?: number }) => {
  return apiClient.get<ISearchHistoryResponse>(SEARCH_ENDPOINT.HISTORY, { params });
};

export const deleteSearchHistoryEntry = async (id: string) => {
  return apiClient.delete<IDeleteSearchHistoryResponse>(SEARCH_ENDPOINT.DELETE_HISTORY_ENTRY(id));
};

export const deleteAllSearchHistory = async () => {
  return apiClient.delete<IDeleteSearchHistoryResponse>(SEARCH_ENDPOINT.DELETE_ALL_HISTORY);
};

// ============================================================================
// SEARCH
// ============================================================================

export const searchUsers = async (params: ISearchParams) => {
  return apiClient.get<ISearchUsersResponse>(SEARCH_ENDPOINT.SEARCH_USERS, { params });
};

export const searchPosts = async (params: ISearchPostsParams) => {
  return apiClient.get<ISearchPostsResponse>(SEARCH_ENDPOINT.SEARCH_POSTS, { params });
};

export const searchHashtags = async (params: ISearchParams) => {
  return apiClient.get<ISearchHashtagsResponse>(SEARCH_ENDPOINT.SEARCH_HASHTAGS, { params });
};
