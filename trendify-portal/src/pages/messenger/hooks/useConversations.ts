import { useInfiniteQuery } from "@tanstack/react-query";

import { getConversations } from "@/stores/chat/api";
import type { IConversation, IGetConversationsParams } from "@/stores/chat/constants";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const conversationKeys = {
  all: ["conversations"] as const,
  list: (filter?: string) => [...conversationKeys.all, "list", filter ?? "all"] as const,
};

// ============================================================================
// TYPES
// ============================================================================
interface IConversationPage {
  items: IConversation[];
  cursor: string | null;
  hasNext: boolean;
}

// ============================================================================
// HOOK
// ============================================================================
export const useConversations = (filter?: IGetConversationsParams["filter"]) => {
  return useInfiniteQuery<IConversationPage>({
    queryKey: conversationKeys.list(filter),

    queryFn: async ({ pageParam }) => {
      const params: IGetConversationsParams = {
        limit: 20,
        filter,
        ...(pageParam ? { cursor: pageParam as string } : {}),
      };

      const response = await getConversations(params);
      return response.data.data;
    },

    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.cursor : undefined;
    },

    staleTime: 30 * 1000, // 30s — conversations change often
    refetchOnWindowFocus: true,
  });
};
