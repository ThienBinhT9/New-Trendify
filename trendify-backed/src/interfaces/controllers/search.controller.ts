import { Request, Response } from "express";

import { ESearchType } from "@/domain/search";
import {
  SearchUsersUseCase,
  SearchPostsUseCase,
  SearchHashtagsUseCase,
  SaveSearchHistoryUseCase,
  GetSearchHistoryUseCase,
  DeleteSearchHistoryUseCase,
  GetAutocompleteUseCase,
  GetTrendingUseCase,
  SaveRecentlyViewedUseCase,
  GetRecentlyViewedUseCase,
  FederatedSearchUseCase,
} from "@/application/usecases/search";
import { ICacheService } from "@/application/services";
import { SuccessResponse } from "@/shared/responses";

class SearchController {
  constructor(
    private readonly searchUsersUseCase: SearchUsersUseCase,
    private readonly searchPostsUseCase: SearchPostsUseCase,
    private readonly searchHashtagsUseCase: SearchHashtagsUseCase,
    private readonly saveSearchHistoryUseCase: SaveSearchHistoryUseCase,
    private readonly getSearchHistoryUseCase: GetSearchHistoryUseCase,
    private readonly deleteSearchHistoryUseCase: DeleteSearchHistoryUseCase,
    private readonly getAutocompleteUseCase: GetAutocompleteUseCase,
    private readonly getTrendingUseCase: GetTrendingUseCase,
    private readonly saveRecentlyViewedUseCase: SaveRecentlyViewedUseCase,
    private readonly getRecentlyViewedUseCase: GetRecentlyViewedUseCase,
    private readonly federatedSearchUseCase: FederatedSearchUseCase,
    private readonly cacheService: ICacheService,
  ) {}

  // ====================== FEDERATED SEARCH ======================

  federatedSearch = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { q, limit } = request.query as { q: string; limit?: string };

    const result = await this.federatedSearchUseCase.execute({
      query: q,
      viewerId: userId,
      limit: limit ? parseInt(limit) : undefined,
    }) as any;

    // Track search (fire-and-forget)
    this.trackSearch(userId, q, ESearchType.USER, result.meta?.totalResults ?? 0);

    return response.status(200).json(new SuccessResponse({ data: result }));
  };

  // ====================== BASIC SEARCH ======================

  searchUsers = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { q, limit, cursor } = request.query as {
      q: string;
      limit?: string;
      cursor?: string;
    };

    const result = await this.searchUsersUseCase.execute({
      query: q,
      viewerId: userId,
      limit: limit ? parseInt(limit) : undefined,
      cursor,
    });

    // Track search (fire-and-forget)
    this.trackSearch(userId, q, ESearchType.USER, result.resultCount);

    return response.status(200).json(new SuccessResponse({ data: result }));
  };

  searchPosts = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { q, limit, cursor, type, dateFrom, dateTo } = request.query as {
      q: string;
      limit?: string;
      cursor?: string;
      type?: string;
      dateFrom?: string;
      dateTo?: string;
    };

    const result = await this.searchPostsUseCase.execute({
      query: q,
      viewerId: userId,
      limit: limit ? parseInt(limit) : undefined,
      cursor,
      type: type as any,
      dateFrom,
      dateTo,
    });

    // Track search (fire-and-forget)
    this.trackSearch(userId, q, ESearchType.POST, result.resultCount);

    return response.status(200).json(new SuccessResponse({ data: result }));
  };

  searchHashtags = async (request: Request, response: Response) => {
    const { q, limit, cursor } = request.query as {
      q: string;
      limit?: string;
      cursor?: string;
    };

    const result = await this.searchHashtagsUseCase.execute({
      query: q,
      limit: limit ? parseInt(limit) : undefined,
      cursor,
    });

    return response.status(200).json(new SuccessResponse({ data: result }));
  };

  // ====================== AUTOCOMPLETE & TRENDING ======================

  getAutocomplete = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { q, limit } = request.query as { q: string; limit?: string };

    const result = await this.getAutocompleteUseCase.execute({
      userId,
      query: q,
      limit: limit ? parseInt(limit) : undefined,
    });

    return response.status(200).json(new SuccessResponse({ data: result }));
  };

  getTrending = async (request: Request, response: Response) => {
    const { limit } = request.query as { limit?: string };

    const result = await this.getTrendingUseCase.execute({
      limit: limit ? parseInt(limit) : undefined,
    });

    return response.status(200).json(new SuccessResponse({ data: result }));
  };

  // ====================== SEARCH HISTORY ======================

  getSearchHistory = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { limit } = request.query as { limit?: string };

    const result = await this.getSearchHistoryUseCase.execute({
      userId,
      limit: limit ? parseInt(limit) : undefined,
    });

    return response.status(200).json(new SuccessResponse({ data: result }));
  };

  deleteSearchHistoryEntry = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { id } = request.params;

    await this.deleteSearchHistoryUseCase.execute({
      userId,
      searchId: id,
    });

    return response.status(200).json(new SuccessResponse({ message: "Search history entry deleted" }));
  };

  deleteAllSearchHistory = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;

    await this.deleteSearchHistoryUseCase.execute({ userId });

    return response.status(200).json(new SuccessResponse({ message: "All search history deleted" }));
  };

  // ====================== RECENTLY VIEWED ======================

  saveRecentlyViewed = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { resourceId, resourceType } = request.body;

    await this.saveRecentlyViewedUseCase.execute({
      userId,
      resourceId,
      resourceType,
    });

    return response.status(200).json(new SuccessResponse({ message: "Saved" }));
  };

  getRecentlyViewed = async (request: Request, response: Response) => {
    const userId = response.locals?.auth?.userId;
    const { limit, resourceType } = request.query as {
      limit?: string;
      resourceType?: string;
    };

    const result = await this.getRecentlyViewedUseCase.execute({
      userId,
      limit: limit ? parseInt(limit) : undefined,
      resourceType: resourceType as any,
    });

    return response.status(200).json(new SuccessResponse({ data: result }));
  };

  // ====================== PRIVATE HELPERS ======================

  /**
   * Track search for history & trending (fire-and-forget)
   */
  private trackSearch(
    userId: string,
    query: string,
    searchType: ESearchType,
    resultCount: number,
  ): void {
    // Save to history (async, don't await)
    this.saveSearchHistoryUseCase
      .execute({ userId, keyword: query, searchType, resultCount })
      .catch(() => {}); // Swallow errors

    // Track for trending (async, don't await)
    GetTrendingUseCase.trackSearch(this.cacheService, query).catch(() => {});
  }
}

export default SearchController;
