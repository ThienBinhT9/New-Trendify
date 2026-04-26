import { useCallback, useState, useRef } from "react";
import { useAppSelector } from "@/stores";
import apiClient from "@/services/api-clients";
import { IPost } from "@/interfaces/post.interface";

interface ForYouFeedMeta {
  strategy?: Record<string, number>;
  candidateCount?: number;
  userInteractions?: number;
  coldStart?: boolean;
  computeTimeMs?: number;
  fallback?: boolean;
}

interface ForYouFeedResponse {
  posts: IPost[];
  nextCursor: string | null;
  meta: ForYouFeedMeta;
}

interface UseForYouFeedReturn {
  posts: IPost[];
  isLoading: boolean;
  hasNext: boolean;
  meta: ForYouFeedMeta | null;
  fetchPosts: () => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AI_FEED_ENDPOINT = "/ai/feed";

export const useForYouFeed = (limit: number = 20): UseForYouFeedReturn => {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<ForYouFeedMeta | null>(null);
  const isFetchingRef = useRef(false);

  const fetchPosts = useCallback(async () => {
    if (!userId || isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const res = await apiClient.get<{ data: ForYouFeedResponse }>(
        AI_FEED_ENDPOINT,
        { params: { page: 0, limit } },
      );

      const data = res.data?.data;
      if (data) {
        setPosts(data.posts || []);
        setHasNext(!!data.nextCursor);
        setPage(data.nextCursor ? parseInt(data.nextCursor, 10) : 1);
        setMeta(data.meta || null);
      }
    } catch (error) {
      console.error("[useForYouFeed] Error fetching posts:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [userId, limit]);

  const loadMore = useCallback(async () => {
    if (!userId || isFetchingRef.current || !hasNext) return;
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const res = await apiClient.get<{ data: ForYouFeedResponse }>(
        AI_FEED_ENDPOINT,
        { params: { page, limit } },
      );

      const data = res.data?.data;
      if (data) {
        setPosts((prev) => [...prev, ...(data.posts || [])]);
        setHasNext(!!data.nextCursor);
        setPage(data.nextCursor ? parseInt(data.nextCursor, 10) : page + 1);
        setMeta(data.meta || null);
      }
    } catch (error) {
      console.error("[useForYouFeed] Error loading more:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [userId, page, limit, hasNext]);

  const refresh = useCallback(async () => {
    setPage(0);
    setHasNext(true);
    await fetchPosts();
  }, [fetchPosts]);

  return { posts, isLoading, hasNext, meta, fetchPosts, loadMore, refresh };
};
