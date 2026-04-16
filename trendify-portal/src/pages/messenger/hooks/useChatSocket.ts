import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getSocket } from "@/services/socket";
import { addRealtimeMessageToCache } from "./useMessages";
import { conversationKeys } from "./useConversations";
import { playMessageSound } from "../utils/notificationSound";
import { markConversationUnread } from "./useUnreadTracker";
import type { ChatMessagePayload } from "@/services/socket";

/**
 * Hook: Listen for real-time chat events on the user's personal socket room.
 *
 * Since the backend emits `chat:message` to each member's `user:${userId}` room,
 * the client automatically receives messages for ALL conversations (even new ones
 * that aren't in the sidebar yet).
 *
 * Features:
 * - Adds incoming messages to the message list cache
 * - Invalidates conversations to update sidebar order + show new conversations
 * - Plays notification sound (skipped if message is from active conversation)
 */
export const useChatSocket = (
  currentUserId: string,
  activeConversationId?: string,
) => {
  const queryClient = useQueryClient();
  const activeConvRef = useRef(activeConversationId);

  // Keep ref in sync so the socket callback always sees the latest value
  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    // Listen for new messages (delivered via user:${userId} room)
    const handleNewMessage = (payload: ChatMessagePayload) => {
      const { conversationId, message } = payload;

      // Skip messages sent by current user (already handled by optimistic update)
      if (message.senderId === currentUserId) return;

      // Add message to message cache (if conversation is loaded)
      addRealtimeMessageToCache(queryClient, conversationId, message);

      // Invalidate conversations query → refetch → sidebar updates:
      // - Existing conversation moves to top
      // - NEW conversation appears in the list
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });

      // Play notification sound + mark unread if NOT from the currently active conversation
      if (conversationId !== activeConvRef.current) {
        playMessageSound();
        markConversationUnread(conversationId);
      }
    };

    socket.on("chat:message", handleNewMessage);

    return () => {
      socket.off("chat:message", handleNewMessage);
    };
  }, [currentUserId, queryClient]);
};
