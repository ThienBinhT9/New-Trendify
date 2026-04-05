import { EPostType } from "@/domain/post";
import { ESearchType, EViewedResourceType } from "@/domain/search";

// ============================================================================
// BASIC SEARCH DTOs
// ============================================================================

export interface SearchUsersDTO {
  query: string;
  viewerId: string;
  limit?: number;
  cursor?: string;
}

export interface SearchPostsDTO {
  query: string;
  viewerId: string;
  limit?: number;
  cursor?: string;
  type?: EPostType;
  dateFrom?: string;
  dateTo?: string;
}

export interface SearchHashtagsDTO {
  query: string;
  limit?: number;
  cursor?: string;
}

// ============================================================================
// SEARCH HISTORY DTOs
// ============================================================================

export interface SaveSearchHistoryDTO {
  userId: string;
  keyword: string;
  searchType: ESearchType;
  resultCount: number;
}

export interface GetSearchHistoryDTO {
  userId: string;
  limit?: number;
}

export interface DeleteSearchHistoryDTO {
  userId: string;
  searchId?: string; // nếu không truyền → xóa tất cả
}

// ============================================================================
// AUTOCOMPLETE & TRENDING DTOs
// ============================================================================

export interface GetAutocompleteDTO {
  userId: string;
  query: string;
  limit?: number;
}

export interface GetTrendingDTO {
  limit?: number;
}

// ============================================================================
// RECENTLY VIEWED DTOs
// ============================================================================

export interface SaveRecentlyViewedDTO {
  userId: string;
  resourceId: string;
  resourceType: EViewedResourceType;
}

export interface GetRecentlyViewedDTO {
  userId: string;
  limit?: number;
  resourceType?: EViewedResourceType;
}

// ============================================================================
// FEDERATED SEARCH DTO
// ============================================================================

export interface FederatedSearchDTO {
  query: string;
  viewerId: string;
  limit?: number;
}

// ============================================================================
// FILTER & SORT
// ============================================================================

export type SearchSortBy = "relevance" | "recent" | "popular";

export interface SearchFilters {
  type?: ESearchType;
  dateRange?: { from?: string; to?: string };
  hasMedia?: boolean;
  postType?: EPostType;
  sortBy?: SearchSortBy;
}
