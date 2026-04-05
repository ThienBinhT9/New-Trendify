import { Router } from "express";

import searchController from "@/infrastructure/injection/search.injection";

import { authMiddleware } from "@/interfaces/middlewares/auth.middleware";
import {
  validate,
  validateParams,
  validateQuery,
} from "@/interfaces/middlewares/validate.middleware";

import * as schema from "@/interfaces/validators/search.validator";
import { SEARCH_ROUTES } from "@/shared/constants/router.constant";

const route = Router();

route.use(authMiddleware());

// ====================== FEDERATED SEARCH ======================

route.get(
  SEARCH_ROUTES.FEDERATED,
  validateQuery(schema.federatedSearchQuerySchema),
  searchController.federatedSearch,
);

// ====================== BASIC SEARCH ======================

route.get(
  SEARCH_ROUTES.SEARCH_USERS,
  validateQuery(schema.searchUsersQuerySchema),
  searchController.searchUsers,
);

route.get(
  SEARCH_ROUTES.SEARCH_POSTS,
  validateQuery(schema.searchPostsQuerySchema),
  searchController.searchPosts,
);

route.get(
  SEARCH_ROUTES.SEARCH_HASHTAGS,
  validateQuery(schema.searchHashtagsQuerySchema),
  searchController.searchHashtags,
);

// ====================== AUTOCOMPLETE & TRENDING ======================

route.get(
  SEARCH_ROUTES.AUTOCOMPLETE,
  validateQuery(schema.autocompleteQuerySchema),
  searchController.getAutocomplete,
);

route.get(
  SEARCH_ROUTES.TRENDING,
  validateQuery(schema.trendingQuerySchema),
  searchController.getTrending,
);

// ====================== SEARCH HISTORY ======================

route.get(
  SEARCH_ROUTES.HISTORY,
  validateQuery(schema.historyQuerySchema),
  searchController.getSearchHistory,
);

route.delete(
  SEARCH_ROUTES.DELETE_HISTORY_ENTRY,
  validateParams(schema.searchHistoryIdParamSchema),
  searchController.deleteSearchHistoryEntry,
);

route.delete(
  SEARCH_ROUTES.DELETE_ALL_HISTORY,
  searchController.deleteAllSearchHistory,
);

// ====================== RECENTLY VIEWED ======================

route.post(
  SEARCH_ROUTES.SAVE_RECENTLY_VIEWED,
  validate(schema.saveRecentlyViewedSchema),
  searchController.saveRecentlyViewed,
);

route.get(
  SEARCH_ROUTES.GET_RECENTLY_VIEWED,
  validateQuery(schema.recentlyViewedQuerySchema),
  searchController.getRecentlyViewed,
);

export default route;
