import { useState, useRef, useCallback, useEffect } from "react";
import React from "react";
import { Flex, message as antdMessage } from "antd";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useQueryClient } from "@tanstack/react-query";

import MessageBubble from "../message-bubble/MessageBubble";
import type { BubblePosition } from "../message-bubble/MessageBubble";
import ChatInput from "../chat-input/ChatInput";
import TypingIndicator from "./TypingIndicator";
import type { IMessage } from "@/stores/chat/constants";
import type { IDroppedFile } from "../chat-window/ChatWindow";
import { useSendMessage, removeOptimisticMessage } from "../../hooks/useMessages";
import { useChatMediaUpload } from "../../hooks/useChatMediaUpload";
import { useToggleReaction } from "../../hooks/useReaction";
import { EMessageType } from "@/stores/chat/constants";
import { sendMessage } from "@/stores/chat/api";
import { useAppSelector } from "@/stores";
import { getSocket } from "@/services/socket";

import "./MessageList.scss";
import { LoaderSpin } from "@/components/loader";

interface MessageListProps {
  conversationId: string;
  conversationType?: "direct" | "group";
  messages: IMessage[];
  isLoading: boolean;
  isFetchingMore: boolean;
  hasMoreMessages: boolean;
  onLoadMore: () => void;
  droppedFiles?: IDroppedFile[];
  onClearDroppedFiles?: () => void;
  isBlocked?: boolean;
  quickEmoji?: string;
}

// ============================================================================
// Pure helper functions
// ============================================================================

const computePosition = (
  prev: IMessage | undefined,
  curr: IMessage,
  next: IMessage | undefined,
  timeDiffNext: number | null,
  timeDiffPrev: number | null,
): BubblePosition => {
  const isGroupedWithPrev =
    prev !== undefined &&
    prev.senderId === curr.senderId &&
    timeDiffPrev !== null &&
    timeDiffPrev < 180000;
  const isGroupedWithNext =
    next !== undefined &&
    next.senderId === curr.senderId &&
    timeDiffNext !== null &&
    timeDiffNext < 180000;

  if (isGroupedWithPrev && isGroupedWithNext) return "middle";
  if (isGroupedWithPrev && !isGroupedWithNext) return "last";
  if (!isGroupedWithPrev && isGroupedWithNext) return "first";
  return "single";
};

const formatHHmm = (dateStr: string): string => {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getTimestamp = (msg: IMessage): number => new Date(msg.createdAt).getTime();

// ============================================================================
// Stable Virtuoso sub-components
// Defined OUTSIDE component scope so they never get recreated across renders.
// Using refs internally so they can read the latest values without causing
// Virtuoso to perceive a new component type (which would cause a full remount).
// ============================================================================

const VirtuosoFooter = () => null;

// ============================================================================
// COMPONENT
// ============================================================================

const MessageList = ({
  conversationId,
  conversationType = "direct",
  messages,
  isLoading,
  isFetchingMore,
  hasMoreMessages,
  onLoadMore,
  droppedFiles,
  onClearDroppedFiles,
  isBlocked = false,
  quickEmoji,
}: MessageListProps) => {
  const [replyingTo, setReplyingTo] = useState<IMessage | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const isAtBottomRef = useRef(true);
  const queryClient = useQueryClient();

  // Current user — stored in a ref so it's accessible from stable `renderItem` callback
  const currentUserId = useAppSelector((state) => state.auth.user?.id ?? "");
  const currentUserIdRef = useRef(currentUserId);
  useEffect(() => {
    currentUserIdRef.current = currentUserId;
  }, [currentUserId]);

  // conversationType in a ref so stable renderItem can access it
  const conversationTypeRef = useRef(conversationType);
  useEffect(() => {
    conversationTypeRef.current = conversationType;
  }, [conversationType]);

  const allConversationUsers = useAppSelector((state) => {
    const typingIds = state.chat.typingUsers[conversationId] ?? [];
    return typingIds;
  });

  // Typing indicator: resolve IChatUser objects for typing userIds
  // Messages already contain sender info; scan recent messages to find displayName
  const typingUsers = React.useMemo(() => {
    const typingIds = allConversationUsers;
    if (typingIds.length === 0) return [];

    // Build a lookup from recent messages
    const userMap: Record<
      string,
      { id: string; displayName: string; username: string; isVerified: boolean }
    > = {};
    for (const msg of messages) {
      if (msg.sender && !userMap[msg.senderId]) {
        userMap[msg.senderId] = {
          id: msg.senderId,
          displayName: msg.sender.displayName,
          username: msg.sender.username,
          isVerified: msg.sender.isVerified,
        };
      }
    }

    return typingIds.map(
      (id: string) => userMap[id] ?? { id, displayName: "...", username: "", isVerified: false },
    );
  }, [allConversationUsers, messages]);

  // ---- Send message mutation ----
  const sendMessageMutation = useSendMessage(conversationId);

  // ---- Media upload ----
  const { uploadMultipleFiles } = useChatMediaUpload();

  // ============================================================================
  // Keep mutable refs in‑sync so stable callbacks can read latest values
  // without being in the dependency array (avoids re-creating Virtuoso items).
  // ============================================================================

  /** Always points at the current messages array — zero-copy. */
  const messagesRef = useRef<IMessage[]>(messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  /** Ref so VirtuosoHeader can read without causing components obj to change. */
  const isFetchingMoreRef = useRef(isFetchingMore);
  useEffect(() => {
    isFetchingMoreRef.current = isFetchingMore;
  }, [isFetchingMore]);

  const hasMoreMessagesRef = useRef(hasMoreMessages);
  useEffect(() => {
    hasMoreMessagesRef.current = hasMoreMessages;
  }, [hasMoreMessages]);

  const onLoadMoreRef = useRef(onLoadMore);
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  // ---- Virtuoso prepend support ----
  const [firstItemIndex, setFirstItemIndex] = useState(10000);
  const firstItemRef = useRef<IMessage | null>(null);
  const firstItemIndexRef = useRef(10000);

  // Track whether we've done the initial scroll for this conversation
  const hasScrolledInitialRef = useRef(false);

  useEffect(() => {
    if (messages.length === 0) return;

    // First time messages arrive: scroll to bottom without animation (instant jump)
    if (!hasScrolledInitialRef.current) {
      hasScrolledInitialRef.current = true;
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({ index: messages.length - 1, behavior: "auto" });
      });
      firstItemRef.current = messages[0];
      return;
    }

    const currentFirstItem = messages[0];
    if (firstItemRef.current && firstItemRef.current.id !== currentFirstItem.id) {
      const oldFirstIndex = messages.findIndex((m) => m.id === firstItemRef.current?.id);
      if (oldFirstIndex > 0) {
        const next = firstItemIndexRef.current - oldFirstIndex;
        firstItemIndexRef.current = next;
        setFirstItemIndex(next);
      }
    }
    firstItemRef.current = currentFirstItem;
  }, [messages]);

  // ---- Track if user is at bottom ----
  const handleAtBottomStateChange = useCallback((atBottom: boolean) => {
    isAtBottomRef.current = atBottom;
  }, []);

  // ---- followOutput: return 'smooth' so new messages scroll in naturally ----
  const handleFollowOutput = useCallback(() => {
    return isAtBottomRef.current ? "smooth" : false;
  }, []);

  // ---- Scroll to bottom ----
  // Only used as a final fallback – primary scrolling is via Virtuoso's followOutput.
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({ index: "LAST", behavior: "smooth" });
    });
  }, []);

  // ---- Handle send (optimistic) ----
  const handleSend = useCallback(
    async (payload: {
      text: string;
      images: { id: string; file: File; url: string }[];
      replyTo?: any;
    }) => {
      const text = payload.text.trim();
      if (!text && payload.images.length === 0) return;

      const replyToId = payload.replyTo?.id;

      // Helper to patch cache
      type MsgPage = { items: IMessage[]; cursor: string | null; hasNext: boolean };
      const patchCache = (updater: (old: { pages: MsgPage[]; pageParams: unknown[] }) => { pages: MsgPage[]; pageParams: unknown[] }) => {
        queryClient.setQueryData<{ pages: MsgPage[]; pageParams: unknown[] }>(
          ["messages", conversationId],
          (old) => (old ? updater(old) : old),
        );
      };

      // === TEXT-ONLY ===
      if (!payload.images.length) {
        // Set true so Virtuoso's followOutput fires and scrolls smoothly
        isAtBottomRef.current = true;
        sendMessageMutation.mutate(
          { sendParams: { type: EMessageType.TEXT, content: text, replyToId }, replyToMessage: replyingTo || undefined },
        );
        setReplyingTo(null);
        return;
      }

      // === IMAGE / VIDEO (± text) ===
      // Step 1: Insert optimistic image bubble IMMEDIATELY
      const firstFile = payload.images[0].file;
      const isVideo = firstFile.type.startsWith("video/");
      const messageType = isVideo ? EMessageType.VIDEO : EMessageType.IMAGE;
      const localMediaUrls = payload.images.map((img) => img.url);

      const mediaOptId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const mediaOptimistic: IMessage = {
        id: mediaOptId,
        _optimisticId: mediaOptId,
        conversationId,
        senderId: "",
        type: messageType,
        content: undefined,
        mediaIds: [],
        mediaUrls: [],
        localMediaUrls,
        replyToId,
        replyTo: replyingTo || undefined,
        reactions: [],
        readBy: [],
        isUnsent: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isMine: true,
        status: "sending",
      };

      // Set true so followOutput fires when Virtuoso sees the new item
      isAtBottomRef.current = true;
      patchCache((old) => {
        const pages = [...old.pages];
        pages[0] = { ...pages[0], items: [mediaOptimistic, ...pages[0].items] };
        return { ...old, pages };
      });

      setReplyingTo(null);
      // No manual scrollToBottom here — followOutput handles it smoothly

      // Step 2: Fire BOTH operations simultaneously — don't chain them
      // 2a. Upload + send image (background)
      const uploadAndSendMedia = async () => {
        try {
          const filesToUpload = payload.images.map((img) => ({ localId: img.id, file: img.file, localUrl: img.url }));
          const uploadResults = await uploadMultipleFiles(filesToUpload);

          if (uploadResults.length === 0) {
            patchCache((old) => ({ ...old, pages: old.pages.map((page) => ({ ...page, items: page.items.map((msg) => msg._optimisticId === mediaOptId ? { ...msg, status: "failed" as const } : msg) })) }));
            antdMessage.error("Không thể tải lên file. Vui lòng thử lại.");
            return;
          }

          const mediaIds = uploadResults.map((r) => r.mediaId);
          const response = await sendMessage({ conversationId, type: messageType, content: undefined, mediaIds, replyToId });
          const realMessage = response.data.data;

          patchCache((old) => ({ ...old, pages: old.pages.map((page) => ({ ...page, items: page.items.map((msg) => msg._optimisticId === mediaOptId ? { ...realMessage, status: "sent" as const, _optimisticId: undefined } : msg) })) }));
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          scrollToBottom();
        } catch {
          patchCache((old) => ({ ...old, pages: old.pages.map((page) => ({ ...page, items: page.items.map((msg) => msg._optimisticId === mediaOptId ? { ...msg, status: "failed" as const } : msg) })) }));
          antdMessage.error("Lỗi khi tải lên media. Vui lòng thử lại.");
        }
      };

      // 2b. Send text immediately (no waiting for upload)
      const sendTextIfNeeded = () => {
        if (!text) return;
        sendMessageMutation.mutate(
          { sendParams: { type: EMessageType.TEXT, content: text, replyToId: undefined }, replyToMessage: undefined },
          { onSettled: () => scrollToBottom() },
        );
      };

      // Fire both at the same time
      uploadAndSendMedia();
      sendTextIfNeeded();
    },
    [sendMessageMutation, scrollToBottom, uploadMultipleFiles, queryClient, conversationId, replyingTo],
  );

  // ---- Reply ----
  const handleReply = useCallback((message: IMessage) => {
    setReplyingTo(message);
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  // ---- React to message ----
  const toggleReaction = useToggleReaction(conversationId);

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      toggleReaction.mutate({ messageId, emoji });
    },
    [toggleReaction],
  );

  // ---- Handle retry failed message ----
  const handleRetry = useCallback(
    (message: IMessage) => {
      if (!message._optimisticId) return;
      removeOptimisticMessage(queryClient, conversationId, message._optimisticId);
      sendMessageMutation.mutate(
        {
          sendParams: {
            type: message.type,
            content: message.content,
            mediaIds: message.mediaIds,
            replyToId: message.replyToId,
          },
          localMediaUrls: message.localMediaUrls,
        },
        { onSettled: () => scrollToBottom() },
      );
    },
    [queryClient, conversationId, sendMessageMutation, scrollToBottom],
  );

  // ---- Handle cancel failed message ----
  const handleCancelFailed = useCallback(
    (message: IMessage) => {
      if (!message._optimisticId) return;
      removeOptimisticMessage(queryClient, conversationId, message._optimisticId);
    },
    [queryClient, conversationId],
  );

  // ---- Load more (startReached) ----
  const handleStartReached = useCallback(() => {
    if (!isFetchingMoreRef.current && hasMoreMessagesRef.current) {
      onLoadMoreRef.current();
    }
  }, []); // stable — reads via refs

  // ---- Typing: emit socket events when user starts/stops typing ----
  const handleTypingStart = useCallback(() => {
    const socket = getSocket();
    socket.emit("chat:typing", { conversationId });
  }, [conversationId]);

  const handleTypingStop = useCallback(() => {
    const socket = getSocket();
    socket.emit("chat:stop-typing", { conversationId });
  }, [conversationId]);

  // ---- Stable action refs for renderItem ----
  // By keeping these as refs we avoid adding them to renderItem's dep array,
  // which would otherwise cause every item to re-render on any state change.
  const handleReplyRef = useRef(handleReply);
  const handleReactRef = useRef(handleReact);
  const handleRetryRef = useRef(handleRetry);
  const handleCancelFailedRef = useRef(handleCancelFailed);
  useEffect(() => {
    handleReplyRef.current = handleReply;
  }, [handleReply]);
  useEffect(() => {
    handleReactRef.current = handleReact;
  }, [handleReact]);
  useEffect(() => {
    handleRetryRef.current = handleRetry;
  }, [handleRetry]);
  useEffect(() => {
    handleCancelFailedRef.current = handleCancelFailed;
  }, [handleCancelFailed]);

  // ---- Stable Virtuoso components — created ONCE via useRef ----
  // The Header component is a closure bound to `isFetchingMoreRef` at mount time.
  // Because it reads the ref (not a prop), it always shows the latest value
  // without the `components` object ever changing reference — Virtuoso never
  // perceives a new component type and therefore never unmounts/remounts the Header.
  const virtuosoComponentsRef = useRef<{
    Header: React.FC;
    Footer: React.FC;
  } | null>(null);
  if (!virtuosoComponentsRef.current) {
    const HeaderComponent = () =>
      isFetchingMoreRef.current ? (
        <Flex justify="center" className="message-list__loader-header">
          <LoaderSpin size={24} />
        </Flex>
      ) : null;
    HeaderComponent.displayName = "VirtuosoHeader";
    virtuosoComponentsRef.current = {
      Header: HeaderComponent,
      Footer: VirtuosoFooter,
    };
  }
  const virtuosoComponents = virtuosoComponentsRef.current;

  // ---- Item content renderer ----
  // Only depends on firstItemIndex and messagesRef (via ref).
  // Stable action handlers are read via refs — no re-render cascade.
  const renderItem = useCallback(
    (index: number, message: IMessage) => {
      const msgs = messagesRef.current;
      const arrayIndex = index - firstItemIndexRef.current;
      const prevMessage = msgs[arrayIndex - 1] as IMessage | undefined;
      const nextMessage = msgs[arrayIndex + 1] as IMessage | undefined;

      const currTs = getTimestamp(message);
      const nextTs = nextMessage ? getTimestamp(nextMessage) : null;
      const prevTs = prevMessage ? getTimestamp(prevMessage) : null;

      const timeDiffNext = nextTs !== null ? nextTs - currTs : null;
      const timeDiffPrev = prevTs !== null ? currTs - prevTs : null;

      const showTimeSeparator = timeDiffNext !== null && timeDiffNext >= 180000;
      const timeSeparatorLabel =
        showTimeSeparator && nextMessage ? formatHHmm(nextMessage.createdAt) : "";

      const isLastMessage = arrayIndex === msgs.length - 1;
      const showRelativeTime = isLastMessage && !!message.isMine;

      const position = computePosition(
        prevMessage,
        message,
        nextMessage,
        timeDiffNext,
        timeDiffPrev,
      );

      const isGroupedWithNext =
        nextMessage &&
        nextMessage.senderId === message.senderId &&
        timeDiffNext !== null &&
        timeDiffNext < 180000;

      const isGroupConversation = conversationTypeRef.current === "group";
      const isOtherInGroup = isGroupConversation && !message.isMine;
      // Avatar: show beside the LAST (or single) bubble of a sender run
      const showAvatar = isOtherInGroup && (position === "single" || position === "last");
      // Name: show above the FIRST (or single) bubble of a sender run
      const showSenderName = isOtherInGroup && (position === "single" || position === "first");

      return (
        <div style={{ paddingBottom: showTimeSeparator ? 0 : isGroupedWithNext ? 2 : 6 }}>
          <MessageBubble
            message={message}
            currentUserId={currentUserIdRef.current}
            showRelativeTime={showRelativeTime}
            position={position}
            isGroupConversation={isGroupConversation}
            showAvatar={showAvatar}
            showSenderName={showSenderName}
            onReply={handleReplyRef.current}
            onReact={handleReactRef.current}
            onRetry={handleRetryRef.current}
            onCancel={handleCancelFailedRef.current}
          />
          {showTimeSeparator && (
            <div className="message-list__time-separator">
              <span className="message-list__time-separator-text">{timeSeparatorLabel}</span>
            </div>
          )}
        </div>
      );
    },
    [], // stable — reads live data via refs; no dep causes unnecessary item re-renders
  );

  // ---- Loading skeleton ----
  if (isLoading) {
    return (
      <Flex vertical className="message-list" id="messageList">
        <div className="message-list__skeleton-container">
          {Array.from({ length: 8 }).map((_, i) => (
            <Flex key={i} justify={i % 2 === 0 ? "flex-start" : "flex-end"}>
              <div
                className={`message-list__skeleton-bubble ${
                  i % 2 !== 0 ? "message-list__skeleton-bubble--mine" : ""
                }`}
                style={{ width: `${100 + (i % 3) * 100}px` }}
              />
            </Flex>
          ))}
        </div>
      </Flex>
    );
  }

  return (
    <Flex
      vertical
      className="message-list"
      id="messageList"
      style={{ position: "relative", flex: 1, overflow: "hidden" }}
    >
      <Virtuoso
        ref={virtuosoRef}
        className="message-list__virtuoso"
        data={messages}
        firstItemIndex={firstItemIndex}
        initialTopMostItemIndex={messages.length > 0 ? messages.length - 1 : 0}
        startReached={handleStartReached}
        alignToBottom
        followOutput={handleFollowOutput}
        atBottomStateChange={handleAtBottomStateChange}
        atBottomThreshold={50}
        increaseViewportBy={{ top: 200, bottom: 0 }}
        overscan={200}
        components={virtuosoComponents}
        itemContent={renderItem}
        computeItemKey={(_index, msg) => msg.id}
      />

      {isBlocked ? (
        <Flex
          align="center"
          justify="center"
          style={{
            padding: "16px",
            borderTop: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
            background: "var(--bg-secondary)",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 500 }}>
            Bạn không thể trả lời cuộc trò chuyện này.
          </span>
        </Flex>
      ) : (
        <>
          <TypingIndicator typingUsers={typingUsers} />
          <ChatInput
            onSend={handleSend}
            onTyping={handleTypingStart}
            onStopTyping={handleTypingStop}
            droppedFiles={droppedFiles}
            onClearDroppedFiles={onClearDroppedFiles}
            replyingTo={replyingTo}
            onCancelReply={handleCancelReply}
            quickEmoji={quickEmoji}
          />
        </>
      )}
    </Flex>
  );
};

export default MessageList;
