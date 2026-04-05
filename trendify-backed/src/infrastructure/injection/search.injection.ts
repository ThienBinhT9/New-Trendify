import SearchController from "@/interfaces/controllers/search.controller";

import {
  MongooseUserRepository,
  MongoosePostRepository,
  MongooseBlockRepository,
  MongooseFollowRepository,
  MongooseLikeRepository,
  MongooseSaveRepository,
  MongooseMediaRepository,
  MongooseSearchHistoryRepository,
  MongooseRecentlyViewedRepository,
} from "@/infrastructure/database/repositories";
import RedisService from "@/infrastructure/services/redis.service";
import S3Service from "@/infrastructure/services/s3.service";

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

import { SearchCacheService } from "@/application/services/search-cache.service";

// Infrastructure
const userRepo = new MongooseUserRepository();
const postRepo = new MongoosePostRepository();
const blockRepo = new MongooseBlockRepository();
const followRepo = new MongooseFollowRepository();
const likeRepo = new MongooseLikeRepository();
const saveRepo = new MongooseSaveRepository();
const mediaRepo = new MongooseMediaRepository();
const searchHistoryRepo = new MongooseSearchHistoryRepository();
const recentlyViewedRepo = new MongooseRecentlyViewedRepository();
const storageSvc = new S3Service();

const cacheSvc = RedisService.getInstance();
const searchCacheSvc = new SearchCacheService(cacheSvc);

// Basic Search Use Cases
const searchUsersUseCase = new SearchUsersUseCase(
  userRepo,
  blockRepo,
  followRepo,
  mediaRepo,
  storageSvc,
);

const searchPostsUseCase = new SearchPostsUseCase(
  postRepo,
  userRepo,
  blockRepo,
  likeRepo,
  saveRepo,
  followRepo,
  mediaRepo,
  storageSvc,
);

const searchHashtagsUseCase = new SearchHashtagsUseCase();

// Search History Use Cases
const saveSearchHistoryUseCase = new SaveSearchHistoryUseCase(searchHistoryRepo);
const getSearchHistoryUseCase = new GetSearchHistoryUseCase(searchHistoryRepo);
const deleteSearchHistoryUseCase = new DeleteSearchHistoryUseCase(searchHistoryRepo);

// Autocomplete & Trending Use Cases
const getAutocompleteUseCase = new GetAutocompleteUseCase(
  searchHistoryRepo,
  userRepo,
  cacheSvc,
);

const getTrendingUseCase = new GetTrendingUseCase(cacheSvc);

// Recently Viewed Use Cases
const saveRecentlyViewedUseCase = new SaveRecentlyViewedUseCase(recentlyViewedRepo);
const getRecentlyViewedUseCase = new GetRecentlyViewedUseCase(
  recentlyViewedRepo,
  userRepo,
  postRepo,
  mediaRepo,
  storageSvc,
);

// Federated Search Use Case
const federatedSearchUseCase = new FederatedSearchUseCase(
  searchUsersUseCase,
  searchPostsUseCase,
  searchHashtagsUseCase,
  searchCacheSvc,
);

// Controller
const searchController = new SearchController(
  searchUsersUseCase,
  searchPostsUseCase,
  searchHashtagsUseCase,
  saveSearchHistoryUseCase,
  getSearchHistoryUseCase,
  deleteSearchHistoryUseCase,
  getAutocompleteUseCase,
  getTrendingUseCase,
  saveRecentlyViewedUseCase,
  getRecentlyViewedUseCase,
  federatedSearchUseCase,
  cacheSvc,
);

export default searchController;
