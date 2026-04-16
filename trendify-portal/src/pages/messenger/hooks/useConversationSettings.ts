import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api-clients";
import { CHAT_ENDPOINT } from "@/stores/chat/constants";
import { conversationKeys } from "./useConversations";

interface IConversationSettings {
  themeId?: string;
  quickEmoji?: string;
  nicknames?: Record<string, string>;
}

export const useUpdateConversationSettings = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<IConversationSettings>) => {
      const url = `${CHAT_ENDPOINT.CONVERSATION_DETAIL(conversationId)}/settings`;
      const res = await apiClient.patch(url, settings);
      return res.data.data;
    },
    onMutate: async (variables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: conversationKeys.all });

      // Optimistic update across all conversation lists filtering (all, unread, etc)
      const queryFilters = [undefined, "all", "unread", "archived", "pinned"];
      
      queryFilters.forEach(filter => {
        queryClient.setQueryData(conversationKeys.list(filter), (old: any) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map((c: any) => {
                if (c.id === conversationId) {
                  return {
                    ...c,
                    settings: {
                      ...c.settings,
                      ...variables,
                      ...(variables.nicknames ? {
                        nicknames: {
                          ...(c.settings?.nicknames || {}),
                          ...variables.nicknames
                        }
                      } : {})
                    }
                  };
                }
                return c;
              })
            }))
          };
        });
      });
    },
  });
};
