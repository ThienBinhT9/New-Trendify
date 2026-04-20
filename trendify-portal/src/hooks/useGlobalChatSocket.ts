import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { getSocket } from "@/services/socket";
import type { ChatMessagePayload } from "@/services/socket";
import { playMessageSound } from "@/pages/messenger/utils/notificationSound";
import { markConversationUnread } from "@/pages/messenger/hooks/useUnreadTracker";
import { conversationKeys } from "@/pages/messenger/hooks/useConversations";
import ROUTE_PATHS from "@/routes/path.route";

/**
 * Global chat socket listener — active on ALL private routes.
 *
 * Responsibilities (complementary to the local `useChatSocket` in Messenger):
 *  - When NOT on the Messenger page: play sound + mark badge for every
 *    incoming message from another user.
 *  - When on the Messenger page: `useChatSocket` (mounted inside Messenger)
 *    already handles everything. This hook detects that and skips sound/badge
 *    to avoid double-firing.
 *  - Invalidates conversations cache so the sidebar stays fresh regardless
 *    of which page is currently active.
 *  - Updates the document title with an unread count badge when the tab is
 *    in the background (visibilitychange).
 *
 * NOTE: This hook does NOT write to the message cache — that is left to
 * `useChatSocket` (Messenger-only) so there is no double-insert.
 */
export const useGlobalChatSocket = (currentUserId: string) => {
  const queryClient = useQueryClient();
  const location = useLocation();

  // Keep a ref to the current pathname so the socket callback always sees
  // the latest value without re-attaching the listener.
  const pathnameRef = useRef(location.pathname);
  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  // Track total unread message count for the document title badge.
  const unreadCountRef = useRef(0);
  const originalTitleRef = useRef(document.title);

  // Update document title badge helper
  const updateTitleBadge = (delta: number) => {
    unreadCountRef.current = Math.max(0, unreadCountRef.current + delta);
    if (unreadCountRef.current > 0) {
      document.title = `(${unreadCountRef.current}) ${originalTitleRef.current}`;
    } else {
      document.title = originalTitleRef.current;
    }
  };

  // When user comes back to the tab, clear the title badge
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        unreadCountRef.current = 0;
        document.title = originalTitleRef.current;
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    if (!currentUserId) return;

    const socket = getSocket();

    const handleNewMessage = (payload: ChatMessagePayload) => {
      const { conversationId, message } = payload;

      // Skip own messages — already handled by optimistic update
      if (message.senderId === currentUserId) return;

      const isOnMessengerPage = pathnameRef.current.startsWith(ROUTE_PATHS.MESSAGE);

      if (!isOnMessengerPage) {
        // Not on Messenger — handle sound + badge + cache invalidation here.
        // (When on Messenger, useChatSocket in Messenger.tsx handles all of this.)
        queryClient.invalidateQueries({ queryKey: conversationKeys.all });
        playMessageSound();
        markConversationUnread(conversationId);

        // Update tab title badge when hidden
        if (document.visibilityState === "hidden") {
          updateTitleBadge(+1);
        }
      }
    };

    socket.on("chat:message", handleNewMessage);

    return () => {
      socket.off("chat:message", handleNewMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, queryClient]);
};
