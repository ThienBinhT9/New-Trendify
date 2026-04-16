import { useState, useRef, useCallback, useMemo, memo, useEffect } from "react";
import { Flex, message as antdMessage } from "antd";
import { Virtuoso, VirtuosoHandle } from "react-virtuoso";
import { useQueryClient } from "@tanstack/react-query";

import MessageBubble from "../message-bubble/MessageBubble";
import type { BubblePosition } from "../message-bubble/MessageBubble";
import ChatInput from "../chat-input/ChatInput";
import type { IMessage } from "@/stores/chat/constants";
import type { IDroppedFile } from "../chat-window/ChatWindow";
import { useSendMessage, removeOptimisticMessage } from "../../hooks/useMessages";
import { useChatMediaUpload } from "../../hooks/useChatMediaUpload";
import { useToggleReaction } from "../../hooks/useReaction";
import { EMessageType } from "@/stores/chat/constants";
import { sendMessage } from "@/stores/chat/api";

import "./MessageList.scss";
import { LoaderSpin } from "@/components/loader";

interface MessageListProps {
  conversationId: string;
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
    prev !== undefined && prev.senderId === curr.senderId && timeDiffPrev !== null && timeDiffPrev < 180000;
  const isGroupedWithNext =
    next !== undefined && next.senderId === curr.senderId && timeDiffNext !== null && timeDiffNext < 180000;

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
// ============================================================================

const VirtuosoFooter = () => null;

const VirtuosoHeader = memo(({ isFetchingMore }: { isFetchingMore: boolean }) =>
  isFetchingMore ? (
    <Flex justify="center" className="message-list__loader-header">
      <LoaderSpin size={24} />
    </Flex>
  ) : null,
);
VirtuosoHeader.displayName = "VirtuosoHeader";

// ============================================================================
// COMPONENT
// ============================================================================

const MessageList = ({
  conversationId,
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

  // ---- Send message mutation ----
  const sendMessageMutation = useSendMessage(conversationId);

  // ---- Media upload ----
  const { uploadMultipleFiles, uploadVoice } = useChatMediaUpload();

  // ---- Virtuoso prepend support ----
  const [firstItemIndex, setFirstItemIndex] = useState(10000);
  const firstItemRef = useRef<IMessage | null>(null);

  useEffect(() => {
    if (messages.length === 0) return;
    const currentFirstItem = messages[0];

    // If first item changed but we have an old first item, check if we prepended messages
    if (firstItemRef.current && firstItemRef.current.id !== currentFirstItem.id) {
      const oldFirstIndex = messages.findIndex((m) => m.id === firstItemRef.current?.id);
      if (oldFirstIndex > 0) {
        // We prepended `oldFirstIndex` items -> Shift index back so items keep same DOM index
        setFirstItemIndex((prev) => prev - oldFirstIndex);
      }
    }

    firstItemRef.current = currentFirstItem;
  }, [messages]);

  // ---- Track if user is at bottom ----
  const handleAtBottomStateChange = useCallback((atBottom: boolean) => {
    isAtBottomRef.current = atBottom;
  }, []);

  // ---- followOutput as callback — only auto-scroll when user is at bottom ----
  const handleFollowOutput = useCallback(() => {
    return isAtBottomRef.current ? "auto" : false;
  }, []);

  // ---- Scroll to bottom ----
  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      virtuosoRef.current?.scrollToIndex({ index: "LAST", behavior: "smooth" });
    });
  }, []);

  // ---- Handle send (optimistic) ----
  const handleSend = useCallback(
    async (payload: { text: string; images: { id: string; file: File; url: string }[]; replyTo?: any }) => {
      const text = payload.text.trim();
      if (!text && payload.images.length === 0) return;

      const replyToId = payload.replyTo?.id;

      // --- Text-only message: use mutation's built-in optimistic via onMutate ---
      if (text && payload.images.length === 0) {
        sendMessageMutation.mutate(
          {
            sendParams: { type: EMessageType.TEXT, content: text, replyToId },
          },
          { onSettled: () => scrollToBottom() },
        );
        setReplyingTo(null);
        scrollToBottom();
        return;
      }

      // --- Media messages: manually insert optimistic, then upload + send ---
      if (payload.images.length > 0) {
        const localMediaUrls = payload.images.map((img) => img.url);
        const firstFile = payload.images[0].file;
        const isVideo = firstFile.type.startsWith("video/");
        const messageType = isVideo ? EMessageType.VIDEO : EMessageType.IMAGE;

        // 1. IMMEDIATELY insert optimistic message with local blob URLs
        const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const optimisticMessage: IMessage = {
          id: optimisticId,
          _optimisticId: optimisticId,
          conversationId,
          senderId: "",
          type: messageType,
          content: text || undefined,
          mediaIds: [],
          mediaUrls: [],
          localMediaUrls,
          replyToId,
          reactions: [],
          readBy: [],
          isUnsent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isMine: true,
          status: "sending",
        };

        queryClient.setQueryData<{ pages: { items: IMessage[]; cursor: string | null; hasNext: boolean }[]; pageParams: unknown[] }>(
          ["messages", conversationId],
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

        setReplyingTo(null);
        scrollToBottom();

        // 2. Upload media in background
        try {
          const filesToUpload = payload.images.map((img) => ({
            localId: img.id,
            file: img.file,
            localUrl: img.url,
          }));

          const uploadResults = await uploadMultipleFiles(filesToUpload);

          if (uploadResults.length === 0) {
            // Mark as failed
            queryClient.setQueryData<{ pages: { items: IMessage[]; cursor: string | null; hasNext: boolean }[]; pageParams: unknown[] }>(
              ["messages", conversationId],
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    items: page.items.map((msg) =>
                      msg._optimisticId === optimisticId
                        ? { ...msg, status: "failed" as const }
                        : msg,
                    ),
                  })),
                };
              },
            );
            antdMessage.error("Không thể tải lên file. Vui lòng thử lại.");
            return;
          }

          const mediaIds = uploadResults.map((r) => r.mediaId);

          // 3. Call API to send the message
          const response = await sendMessage({
            conversationId,
            type: messageType,
            content: text || undefined,
            mediaIds,
            replyToId,
          });

          const realMessage = response.data.data;

          // 4. Replace optimistic with real message
          queryClient.setQueryData<{ pages: { items: IMessage[]; cursor: string | null; hasNext: boolean }[]; pageParams: unknown[] }>(
            ["messages", conversationId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.map((msg) =>
                    msg._optimisticId === optimisticId
                      ? { ...realMessage, status: "sent" as const, _optimisticId: undefined }
                      : msg,
                  ),
                })),
              };
            },
          );
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          scrollToBottom();
        } catch {
          // Mark as failed
          queryClient.setQueryData<{ pages: { items: IMessage[]; cursor: string | null; hasNext: boolean }[]; pageParams: unknown[] }>(
            ["messages", conversationId],
            (old) => {
              if (!old) return old;
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.map((msg) =>
                    msg._optimisticId === optimisticId
                      ? { ...msg, status: "failed" as const }
                      : msg,
                  ),
                })),
              };
            },
          );
          antdMessage.error("Lỗi khi tải lên media. Vui lòng thử lại.");
        }
        return;
      }

      setReplyingTo(null);
    },
    [sendMessageMutation, scrollToBottom, uploadMultipleFiles, queryClient, conversationId],
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
      // Remove the failed message
      removeOptimisticMessage(queryClient, conversationId, message._optimisticId);
      // Re-send
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

  // ---- Voice message ----
  const handleSendVoice = useCallback(
    async (blob: Blob) => {
      try {
        const uploadResult = await uploadVoice(blob);
        if (!uploadResult) {
          antdMessage.error("Không thể tải lên tin nhắn thoại.");
          return;
        }

        sendMessageMutation.mutate(
          {
            sendParams: {
              type: EMessageType.VOICE,
              mediaIds: [uploadResult.mediaId],
            },
          },
          { onSettled: () => scrollToBottom() },
        );
      } catch {
        antdMessage.error("Lỗi khi gửi tin nhắn thoại.");
      }
    },
    [uploadVoice, sendMessageMutation, scrollToBottom],
  );

  // ---- Load more (startReached) ----
  const handleStartReached = useCallback(() => {
    if (!isFetchingMore && hasMoreMessages) {
      onLoadMore();
    }
  }, [isFetchingMore, hasMoreMessages, onLoadMore]);

  // ---- Stable Virtuoso components ----
  const virtuosoComponents = useMemo(
    () => ({
      Header: () => <VirtuosoHeader isFetchingMore={isFetchingMore} />,
      Footer: VirtuosoFooter,
    }),
    [isFetchingMore],
  );

  // ---- Item content renderer ----
  const renderItem = useCallback(
    (index: number, message: IMessage) => {
      const arrayIndex = index - firstItemIndex;
      const prevMessage = messages[arrayIndex - 1] as IMessage | undefined;
      const nextMessage = messages[arrayIndex + 1] as IMessage | undefined;

      const currTs = getTimestamp(message);
      const nextTs = nextMessage ? getTimestamp(nextMessage) : null;
      const prevTs = prevMessage ? getTimestamp(prevMessage) : null;

      const timeDiffNext = nextTs !== null ? nextTs - currTs : null;
      const timeDiffPrev = prevTs !== null ? currTs - prevTs : null;

      const showTimeSeparator = timeDiffNext !== null && timeDiffNext >= 180000;
      const timeSeparatorLabel = showTimeSeparator && nextMessage ? formatHHmm(nextMessage.createdAt) : "";

      const isLastMessage = arrayIndex === messages.length - 1;
      const showRelativeTime = isLastMessage && !!message.isMine;

      const position = computePosition(prevMessage, message, nextMessage, timeDiffNext, timeDiffPrev);

      const isGroupedWithNext =
        nextMessage &&
        nextMessage.senderId === message.senderId &&
        timeDiffNext !== null &&
        timeDiffNext < 180000;

      return (
        <div style={{ paddingBottom: showTimeSeparator ? 0 : isGroupedWithNext ? 2 : 6 }}>
          <MessageBubble
            message={message}
            showRelativeTime={showRelativeTime}
            position={position}
            onReply={handleReply}
            onReact={handleReact}
            onRetry={handleRetry}
            onCancel={handleCancelFailed}
          />
          {showTimeSeparator && (
            <div className="message-list__time-separator">
              <span className="message-list__time-separator-text">{timeSeparatorLabel}</span>
            </div>
          )}
        </div>
      );
    },
    [firstItemIndex, messages, handleReply, handleReact, handleRetry, handleCancelFailed],
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
        initialTopMostItemIndex={messages.length - 1}
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
        <ChatInput
          onSend={handleSend}
          onSendVoice={handleSendVoice}
          droppedFiles={droppedFiles}
          onClearDroppedFiles={onClearDroppedFiles}
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          quickEmoji={quickEmoji}
        />
      )}
    </Flex>
  );
};

export default MessageList;
