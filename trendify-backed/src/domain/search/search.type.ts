// ============================================================================
// ENUMS
// ============================================================================

export enum ESearchType {
  USER = "user",
  POST = "post",
  HASHTAG = "hashtag",
}

// ============================================================================
// INTERFACES
// ============================================================================

export interface ISearchHistoryProps {
  userId: string;
  keyword: string;
  searchType: ESearchType;
  resultCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISearchHistoryCreateInput {
  userId: string;
  keyword: string;
  searchType: ESearchType;
  resultCount: number;
}
