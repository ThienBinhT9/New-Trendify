import { IApiResponse } from "@/interfaces/api.interface";
import { IPost } from "@/interfaces/post.interface";
import { IUserRelationship } from "@/stores/profile/constants";

// ============================================================================
// ACTIONS ENUM
// ============================================================================

export enum ESearchActions {
  GET_TRENDING = "GET_TRENDING",
  GET_AUTOCOMPLETE = "GET_AUTOCOMPLETE",
  GET_SEARCH_HISTORY = "GET_SEARCH_HISTORY",
  DELETE_SEARCH_HISTORY_ENTRY = "DELETE_SEARCH_HISTORY_ENTRY",
  DELETE_ALL_SEARCH_HISTORY = "DELETE_ALL_SEARCH_HISTORY",
  SEARCH_USERS = "SEARCH_USERS",
  SEARCH_POSTS = "SEARCH_POSTS",
  SEARCH_HASHTAGS = "SEARCH_HASHTAGS",
}

// ============================================================================
// ENDPOINTS
// ============================================================================

export const SEARCH_ENDPOINT = {
  FEDERATED: "/search",
  SEARCH_USERS: "/search/users",
  SEARCH_POSTS: "/search/posts",
  SEARCH_HASHTAGS: "/search/hashtags",
  AUTOCOMPLETE: "/search/autocomplete",
  TRENDING: "/search/trending",
  HISTORY: "/search/history",
  DELETE_HISTORY_ENTRY: (id: string) => `/search/history/${id}`,
  DELETE_ALL_HISTORY: "/search/history",
};

// ============================================================================
// TRENDING
// ============================================================================

export interface ITrendingItem {
  keyword: string;
  type: "keyword" | "hashtag";
  score: number;
}

export interface ITrendingResponse extends IApiResponse {
  data: {
    trending: ITrendingItem[];
  };
}

// ============================================================================
// AUTOCOMPLETE
// ============================================================================

export interface IAutocompleteSuggestion {
  text: string;
  source: "history" | "trending" | "username";
}

export interface IAutocompleteResponse extends IApiResponse {
  data: {
    suggestions: IAutocompleteSuggestion[];
  };
}

// ============================================================================
// SEARCH HISTORY
// ============================================================================

export interface ISearchHistoryEntry {
  id: string;
  keyword: string;
  searchType: string;
  resultCount: number;
  searchedAt: string;
}

export interface ISearchHistoryResponse extends IApiResponse {
  data: {
    history: ISearchHistoryEntry[];
  };
}

export interface IDeleteSearchHistoryResponse extends IApiResponse {
  message: string;
}

// ============================================================================
// SEARCH USERS — uses IUserRelationship (same shape as FriendCard)
// ============================================================================

export interface ISearchUsersResponse extends IApiResponse {
  data: {
    users: IUserRelationship[];
    nextCursor?: string;
    resultCount: number;
  };
}

// ============================================================================
// SEARCH POSTS
// ============================================================================

export interface ISearchPostsResponse extends IApiResponse {
  data: {
    posts: IPost[];
    nextCursor?: string;
    resultCount: number;
  };
}

// ============================================================================
// SEARCH HASHTAGS
// ============================================================================

export interface IHashtagResult {
  tag: string;
  postCount: number;
}

export interface ISearchHashtagsResponse extends IApiResponse {
  data: {
    hashtags: IHashtagResult[];
    nextCursor?: string;
    resultCount: number;
  };
}

// ============================================================================
// SEARCH PARAMS
// ============================================================================

export interface ISearchParams {
  q: string;
  limit?: number;
  cursor?: string;
}

export interface ISearchPostsParams extends ISearchParams {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}
