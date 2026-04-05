import { Flex, Skeleton, Tabs } from "antd";
import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";

import Text from "@/components/text/Text";
import Icon from "@/components/icon/Icon";
import { useAppDispatch } from "@/stores";
import {
  IAutocompleteSuggestion,
  ISearchHistoryEntry,
  ITrendingItem,
} from "@/stores/search/constants";
import {
  getTrendingAction,
  getAutocompleteAction,
  getSearchHistoryAction,
  deleteSearchHistoryEntryAction,
  deleteAllSearchHistoryAction,
} from "@/stores/search/actions";
import ROUTE_PATHS from "@/routes/path.route";

import "./Search.scss";
import { useSearchStore, setSearchInputValue } from "./searchStore";

// ============================================================================
// TAB ↔ PATH MAPPING
// ============================================================================

type SearchTab = "top" | "people" | "posts" | "hashtags";

const TAB_TO_PATH: Record<SearchTab, string> = {
  top: ROUTE_PATHS.SEARCH,
  people: ROUTE_PATHS.SEARCH_PEOPLE,
  posts: ROUTE_PATHS.SEARCH_POSTS,
  hashtags: ROUTE_PATHS.SEARCH_HASHTAGS,
};

const PATH_TO_TAB: Record<string, SearchTab> = {
  [ROUTE_PATHS.SEARCH]: "top",
  [ROUTE_PATHS.SEARCH_PEOPLE]: "people",
  [ROUTE_PATHS.SEARCH_POSTS]: "posts",
  [ROUTE_PATHS.SEARCH_HASHTAGS]: "hashtags",
};

// ============================================================================
// TRENDING ITEM
// ============================================================================

const TrendingItemCard = ({
  item,
  onSelect,
}: {
  item: ITrendingItem;
  onSelect: (kw: string) => void;
}) => (
  <Flex
    className="trending-item"
    align="flex-start"
    gap={12}
    onClick={() => onSelect(item.keyword)}
  >
    <Flex vertical className="trending-item-content" flex={1}>
      <Flex align="center" gap={6}>
        <Text textType="SB14" className="trending-item-keyword">
          {item.keyword}
        </Text>
        {item.type === "hashtag" && <span className="trending-item-badge">Hashtag</span>}
      </Flex>
      <Text textType="R12" className="text-second-color">
        {item.type === "hashtag" ? "Hashtag thịnh hành" : "Đang thịnh hành"}
      </Text>
    </Flex>
  </Flex>
);

// ============================================================================
// SKELETONS
// ============================================================================

const TrendingSkeleton = () => (
  <Flex vertical>
    {Array.from({ length: 5 }).map((_, i) => (
      <Flex key={i} className="trending-item" gap={12} align="center">
        <Flex vertical flex={1} gap={8}>
          <Skeleton.Input active style={{ width: 180, height: 16 }} />
          <Skeleton.Input active style={{ width: 100, height: 12 }} />
        </Flex>
      </Flex>
    ))}
  </Flex>
);

// ============================================================================
// SEARCH HISTORY
// ============================================================================

const SearchHistory = ({
  history,
  onSelect,
  onDelete,
  onClearAll,
}: {
  history: ISearchHistoryEntry[];
  onSelect: (query: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}) => {
  if (history.length === 0) return null;

  return (
    <Flex vertical className="search-history-section">
      <Flex align="center" justify="space-between" className="search-history-header">
        <Text textType="SB14">Gần đây</Text>
        <Text textType="R14" className="search-history-clear-all" onClick={onClearAll}>
          Xoá tất cả
        </Text>
      </Flex>
      {history.map((item) => (
        <Flex
          key={item.id}
          className="search-history-item"
          align="center"
          gap={12}
          onClick={() => onSelect(item.keyword)}
        >
          <Flex className="search-history-icon-wrapper" align="center" justify="center">
            <Icon name="HistoryIcon" size={16} />
          </Flex>
          <Flex vertical flex={1} gap={1}>
            <Text textType="R14">{item.keyword}</Text>
          </Flex>
          <Icon
            name="CloseIcon"
            size={14}
            className="search-history-delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
          />
        </Flex>
      ))}
    </Flex>
  );
};

// ============================================================================
// AUTOCOMPLETE
// ============================================================================

const AutocompleteResults = ({
  suggestions,
  isLoading,
  onSelect,
}: {
  suggestions: IAutocompleteSuggestion[];
  isLoading: boolean;
  onSelect: (text: string) => void;
}) => {
  if (isLoading) {
    return (
      <Flex vertical className="autocomplete-section">
        {Array.from({ length: 4 }).map((_, i) => (
          <Flex key={i} className="autocomplete-item" align="center" gap={12}>
            <Skeleton.Avatar active size={20} />
            <Skeleton.Input active style={{ width: 200, height: 14 }} />
          </Flex>
        ))}
      </Flex>
    );
  }

  if (!suggestions.length) return null;

  return (
    <Flex vertical className="autocomplete-section">
      {suggestions.map((s, index) => (
        <Flex
          key={`${s.text}-${index}`}
          className="autocomplete-item"
          align="center"
          gap={12}
          onClick={() => onSelect(s.text)}
        >
          <Flex className="autocomplete-icon-wrapper" align="center" justify="center">
            <Icon name={s.source === "history" ? "HistoryIcon" : "SearchSmall"} size={16} />
          </Flex>
          <Text textType="R14" style={{ flex: 1 }}>
            {s.text}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Search = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { inputValue, isFocused } = useSearchStore();

  const activeTab: SearchTab = PATH_TO_TAB[location.pathname] ?? "top";

  const submittedQ = searchParams.get("q") ?? "";
  const isSubmitted = !!submittedQ;
  const isTyping = !isSubmitted && inputValue.trim().length > 0;
  const showHistory = !isSubmitted && isFocused && !isTyping;
  const showTrending = !isSubmitted && !isTyping && !showHistory;

  // ---- Trending ----
  const [trendingItems, setTrendingItems] = useState<ITrendingItem[]>([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const hasFetchedTrending = useRef(false);

  // ---- Autocomplete ----
  const [acSuggestions, setAcSuggestions] = useState<IAutocompleteSuggestion[]>([]);
  const [acLoading, setAcLoading] = useState(false);
  const acDebounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ---- History ----
  const [searchHistory, setSearchHistory] = useState<ISearchHistoryEntry[]>([]);
  const hasFetchedHistory = useRef(false);

  // ========== TRENDING ==========

  useEffect(() => {
    if (hasFetchedTrending.current) return;
    hasFetchedTrending.current = true;
    setTrendingLoading(true);
    dispatch(getTrendingAction({ limit: 20 }))
      .unwrap()
      .then((data) => setTrendingItems(data.trending))
      .catch(console.error)
      .finally(() => setTrendingLoading(false));
  }, [dispatch]);

  // ========== HISTORY ==========

  useEffect(() => {
    if (hasFetchedHistory.current) return;
    hasFetchedHistory.current = true;
    dispatch(getSearchHistoryAction({ limit: 10 }))
      .unwrap()
      .then((data) => setSearchHistory(data.history))
      .catch(console.error);
  }, [dispatch]);

  // ========== AUTOCOMPLETE ==========

  useEffect(() => {
    if (!isTyping) {
      setAcSuggestions([]);
      return;
    }
    if (acDebounceRef.current) clearTimeout(acDebounceRef.current);

    acDebounceRef.current = setTimeout(() => {
      setAcLoading(true);
      dispatch(getAutocompleteAction({ q: inputValue, limit: 8 }))
        .unwrap()
        .then((data) => setAcSuggestions(data.suggestions))
        .catch(console.error)
        .finally(() => setAcLoading(false));
    }, 250);

    return () => {
      if (acDebounceRef.current) clearTimeout(acDebounceRef.current);
    };
  }, [inputValue, isTyping, dispatch]);

  // ========== SYNC INPUT WITH URL ==========

  const prevQ = useRef("");
  useEffect(() => {
    if (!submittedQ || prevQ.current === submittedQ) return;
    prevQ.current = submittedQ;
    setSearchInputValue(submittedQ);
  }, [submittedQ]);

  // ========== NAVIGATION ==========

  const navigateToSearch = (q: string) => {
    setSearchInputValue(q);
    navigate(`${ROUTE_PATHS.SEARCH}?q=${encodeURIComponent(q)}`);
  };

  const handleTabChange = (key: string) => {
    const tab = key as SearchTab;
    const path = TAB_TO_PATH[tab];
    navigate(`${path}?q=${encodeURIComponent(submittedQ)}`);
  };

  const handleDeleteHistory = (id: string) => {
    setSearchHistory((prev) => prev.filter((item) => item.id !== id));
    dispatch(deleteSearchHistoryEntryAction(id)).catch(console.error);
  };

  const handleClearAllHistory = () => {
    setSearchHistory([]);
    dispatch(deleteAllSearchHistoryAction()).catch(console.error);
  };

  const renderEmpty = (msg: string) => (
    <Flex className="search-empty" align="center" justify="center">
      <Text textType="R14" className="text-second-color">
        {msg}
      </Text>
    </Flex>
  );

  // ========== RENDER ==========

  return (
    <Flex className="search-container">
      <Flex className="search-content">
        {/* History */}
        {showHistory && (
          <SearchHistory
            history={searchHistory}
            onSelect={navigateToSearch}
            onDelete={handleDeleteHistory}
            onClearAll={handleClearAllHistory}
          />
        )}

        {/* Autocomplete */}
        {isTyping && (
          <AutocompleteResults
            suggestions={acSuggestions}
            isLoading={acLoading}
            onSelect={navigateToSearch}
          />
        )}

        {/* Search Results */}
        {isSubmitted && (
          <Flex vertical className="search-results-section">
            <Tabs
              className="search-results-tabs"
              activeKey={activeTab}
              centered
              onChange={handleTabChange}
              items={[
                { key: "top", label: "Liên quan nhất" },
                { key: "people", label: "Người dùng" },
                { key: "hashtags", label: "Hashtag" },
              ]}
            />
            <div className="search-results-content">
              <Outlet />
            </div>
          </Flex>
        )}

        {/* Trending (default) */}
        {showTrending && (
          <Flex vertical className="search-trending-section">
            <Text textType="SB22" className="trending-title">
              Đang thịnh hành
            </Text>
            <Text textType="R12" className="text-second-color trending-subtitle">
              Những gì mọi người đang bàn luận
            </Text>

            {trendingLoading ? (
              <TrendingSkeleton />
            ) : trendingItems.length > 0 ? (
              <Flex vertical>
                {trendingItems.map((item, i) => (
                  <TrendingItemCard
                    key={`${item.keyword}-${i}`}
                    item={item}
                    onSelect={navigateToSearch}
                  />
                ))}
              </Flex>
            ) : (
              renderEmpty("Chưa có xu hướng nào")
            )}
            <div className="list-bottom-spacer" />
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default Search;
