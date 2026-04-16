import { useInfiniteQuery } from "@tanstack/react-query";
import { listHashtagPosts } from "@/stores/post/api";
import { IPost } from "@/interfaces/post.interface";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const hashtagKeys = {
  all: ["hashtags"] as const,
  posts: (tag: string) => [...hashtagKeys.all, tag, "posts"] as const,
};

// ============================================================================
// TYPES
// ============================================================================
interface IHashtagPage {
  posts: IPost[];
  hashtag: string;
  nextCursor?: string;
}

// ============================================================================
// HOOK
// ============================================================================
export const useHashtagPosts = (tag?: string) => {
  return useInfiniteQuery<IHashtagPage>({
    queryKey: tag ? hashtagKeys.posts(tag) : hashtagKeys.all,

    queryFn: async ({ pageParam }) => {
      // If no tag is provided, we shouldn't really execute this, but we handle it just in case
      if (!tag) {
        return { posts: [], hashtag: "", nextCursor: undefined };
      }

      const params = {
        limit: 10,
        ...(pageParam ? { cursor: pageParam as string } : {}),
      };

      const response = await listHashtagPosts(tag, params);
      return response.data.data;
    },

    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => {
      return lastPage.nextCursor;
    },

    // Optional: caching behavior
    staleTime: 60 * 1000, // 1 minute
    enabled: !!tag, // Only run the query if we have a tag
  });
};
