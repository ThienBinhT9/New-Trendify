import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { getSocket } from "@/services/socket";
import { addRealtimeMessageToCache } from "./useMessages";
import { conversationKeys } from "./useConversations";
import { playMessageSound } from "../utils/notificationSound";
import { markConversationUnread } from "./useUnreadTracker";
import { setTypingUsers } from "@/stores/chat/slice";
import { useAppDispatch } from "@/stores";
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
  const dispatch = useAppDispatch();
  const activeConvRef = useRef(activeConversationId);

  // Mutable map: conversationId -> Set of typing userIds (with display info)
  // We use a ref to avoid re-renders on every typing event
  const typingTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const typingUsersRef = useRef<Record<string, string[]>>({});

  // Keep ref in sync so the socket callback always sees the latest value
  useEffect(() => {
    activeConvRef.current = activeConversationId;
  }, [activeConversationId]);

  // Join conversation socket room when active conversation changes.
  // Backend broadcasts chat:typing to conversation:${id} room — client must be in the room to receive.
  useEffect(() => {
    if (!activeConversationId) return;
    const socket = getSocket();
    socket.emit("chat:join", [activeConversationId]);
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

    // Listen for reactions
    const handleReaction = (payload: { conversationId: string; reaction: any }) => {
      const { conversationId, reaction } = payload;
      
      // Update cache
      queryClient.setQueryData<{ pages: any[] }>(
        ["messages", conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              items: page.items.map((msg: any) => {
                if (msg.id === reaction.messageId) {
                  const filteredReactions = msg.reactions?.filter(
                    (r: any) => !(r.userId === reaction.userId && r.emoji === reaction.emoji)
                  ) || [];
                  
                  if (reaction.action === "added") {
                    filteredReactions.push({
                      userId: reaction.userId,
                      emoji: reaction.emoji,
                      createdAt: new Date().toISOString(),
                    });
                  }
                  
                  return { ...msg, reactions: filteredReactions };
                }
                return msg;
              }),
            })),
          };
        }
      );
    };

    socket.on("chat:reaction", handleReaction);

    // Listen for typing indicator events
    const handleTyping = (payload: { conversationId: string; userId: string; isTyping: boolean }) => {
      const { conversationId, userId, isTyping } = payload;

      // Ignore own typing events (shouldn't happen, server uses socket.to() not io.to())
      if (userId === currentUserId) return;

      const current = typingUsersRef.current[conversationId] ?? [];

      if (isTyping) {
        // Add user to typing list if not already there
        if (!current.includes(userId)) {
          typingUsersRef.current[conversationId] = [...current, userId];
        }
        // Reset auto-remove timer (in case stop event is missed)
        if (typingTimersRef.current[userId]) {
          clearTimeout(typingTimersRef.current[userId]);
        }
        typingTimersRef.current[userId] = setTimeout(() => {
          typingUsersRef.current[conversationId] = (typingUsersRef.current[conversationId] ?? []).filter(
            (id) => id !== userId,
          );
          dispatch(setTypingUsers({ conversationId, userIds: typingUsersRef.current[conversationId] }));
        }, 6000);
      } else {
        // Remove user from typing list
        typingUsersRef.current[conversationId] = current.filter((id) => id !== userId);
        if (typingTimersRef.current[userId]) {
          clearTimeout(typingTimersRef.current[userId]);
          delete typingTimersRef.current[userId];
        }
      }

      dispatch(setTypingUsers({ conversationId, userIds: typingUsersRef.current[conversationId] }));
    };

    socket.on("chat:typing", handleTyping);

    return () => {
      socket.off("chat:message", handleNewMessage);
      socket.off("chat:reaction", handleReaction);
      socket.off("chat:typing", handleTyping);
    };
  }, [currentUserId, queryClient, dispatch]);
};
