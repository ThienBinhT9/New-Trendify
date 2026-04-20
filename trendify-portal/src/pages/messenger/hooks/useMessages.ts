import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { getMessages, sendMessage } from "@/stores/chat/api";
import type { IMessage, IGetMessagesParams, ISendMessageParams } from "@/stores/chat/constants";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const messageKeys = {
  all: ["messages"] as const,
  list: (conversationId: string) => [...messageKeys.all, conversationId] as const,
};

// ============================================================================
// TYPES
// ============================================================================
interface IMessagePage {
  items: IMessage[];
  cursor: string | null;
  hasNext: boolean;
}

export interface IOptimisticSendParams {
  sendParams: Omit<ISendMessageParams, "conversationId">;
  /** Local blob URLs for media preview while uploading */
  localMediaUrls?: string[];
  /** Parent message being replied to, to render optimistic quote preview */
  replyToMessage?: IMessage;
}

// ============================================================================
// HOOK: Fetch messages (infinite scroll — oldest first prepend)
// ============================================================================
export const useMessages = (conversationId: string | null) => {
  return useInfiniteQuery<IMessagePage>({
    queryKey: messageKeys.list(conversationId ?? ""),

    queryFn: async ({ pageParam }) => {
      if (!conversationId) {
        return { items: [], cursor: null, hasNext: false };
      }

      const params: IGetMessagesParams = {
        limit: 30,
        ...(pageParam ? { cursor: pageParam as string } : {}),
      };

      const response = await getMessages(conversationId, params);
      return response.data.data;
    },

    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.cursor : undefined;
    },

    enabled: !!conversationId,
    staleTime: 60 * 1000, // 1 minute — messages don't change often once loaded
    refetchOnWindowFocus: false,
  });
};

// ============================================================================
// HOOK: Send message mutation (optimistic UI — Messenger-like)
// ============================================================================
export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: IOptimisticSendParams) => {
      return sendMessage({ conversationId, ...params.sendParams });
    },

    // ---- OPTIMISTIC UPDATE: Show message immediately ----
    onMutate: async (params: IOptimisticSendParams) => {
      // Cancel any refetches so they don't overwrite our optimistic data
      await queryClient.cancelQueries({ queryKey: messageKeys.list(conversationId) });

      const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const optimisticMessage: IMessage = {
        id: optimisticId,
        _optimisticId: optimisticId,
        conversationId,
        senderId: "", // Will be filled by server
        type: params.sendParams.type,
        content: params.sendParams.content,
        mediaIds: params.sendParams.mediaIds,
        mediaUrls: [], // Not yet resolved
        localMediaUrls: params.localMediaUrls, // Local blob URLs for preview
        replyToId: params.sendParams.replyToId,
        replyTo: params.replyToMessage,
        reactions: [],
        readBy: [],
        isUnsent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isMine: true,
        status: "sending",
      };

      // Get previous data for rollback
      const previousData = queryClient.getQueryData<{ pages: IMessagePage[]; pageParams: unknown[] }>(
        messageKeys.list(conversationId),
      );

      // Add optimistic message to cache
      queryClient.setQueryData<{ pages: IMessagePage[]; pageParams: unknown[] }>(
        messageKeys.list(conversationId),
        (old) => {
          if (!old) return old;
          const updatedPages = [...old.pages];
          updatedPages[0] = {
            ...updatedPages[0],
            items: [optimisticMessage, ...updatedPages[0].items],
          };
          return { ...old, pages: updatedPages };
        },
      );

      return { optimisticId, previousData };
    },

    // ---- SUCCESS: Replace optimistic with real message ----
    onSuccess: (response, _params, context) => {
      const realMessage = response.data.data;

      queryClient.setQueryData<{ pages: IMessagePage[]; pageParams: unknown[] }>(
        messageKeys.list(conversationId),
        (old) => {
          if (!old) return old;

          const updatedPages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((msg) =>
              msg._optimisticId === context?.optimisticId
                ? { 
                    ...realMessage, 
                    status: "sent" as const, 
                    _optimisticId: undefined,
                    replyTo: msg.replyTo || realMessage.replyTo // Preserve rich replyTo object if it was locally optimistic
                  }
                : msg,
            ),
          }));

          return { ...old, pages: updatedPages };
        },
      );

      // Also invalidate conversations to update lastMessage preview
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },

    // ---- ERROR: Mark message as failed ----
    onError: (_error, _params, context) => {
      queryClient.setQueryData<{ pages: IMessagePage[]; pageParams: unknown[] }>(
        messageKeys.list(conversationId),
        (old) => {
          if (!old) return old;

          const updatedPages = old.pages.map((page) => ({
            ...page,
            items: page.items.map((msg) =>
              msg._optimisticId === context?.optimisticId
                ? { ...msg, status: "failed" as const }
                : msg,
            ),
          }));

          return { ...old, pages: updatedPages };
        },
      );
    },
  });
};

// ============================================================================
// HELPER: Remove a failed optimistic message from cache
// ============================================================================
export const removeOptimisticMessage = (
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  optimisticId: string,
) => {
  queryClient.setQueryData<{ pages: IMessagePage[]; pageParams: unknown[] }>(
    messageKeys.list(conversationId),
    (old) => {
      if (!old) return old;

      const updatedPages = old.pages.map((page) => ({
        ...page,
        items: page.items.filter((msg) => msg._optimisticId !== optimisticId),
      }));

      return { ...old, pages: updatedPages };
    },
  );
};

// ============================================================================
// HELPERS: Update cache from Socket.IO
// ============================================================================
export const addRealtimeMessageToCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  conversationId: string,
  message: IMessage,
) => {
  queryClient.setQueryData<{ pages: IMessagePage[]; pageParams: unknown[] }>(
    messageKeys.list(conversationId),
    (old) => {
      if (!old) return old;

      // Check for duplicates
      const allMessages = old.pages.flatMap((p) => p.items);
      if (allMessages.some((m) => m.id === message.id)) return old;

      const updatedPages = [...old.pages];
      updatedPages[0] = {
        ...updatedPages[0],
        items: [message, ...updatedPages[0].items],
      };

      return { ...old, pages: updatedPages };
    },
  );
};

