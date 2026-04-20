import { useCallback, useState, useRef, useMemo, DragEvent } from "react";
import { Flex } from "antd";
import { useQuery } from "@tanstack/react-query";

import ChatHeader from "../chat-header/ChatHeader";
import MessageList from "../message-list/MessageList";
import type { IConversationLocal } from "../chat-sidebar/ChatSidebar";
import type { IMessage } from "@/stores/chat/constants";
import { useMessages } from "../../hooks/useMessages";
import { checkBlockStatus } from "@/stores/follow/api";
import { ChatThemeProvider } from "../../context/ChatThemeContext";

import "./ChatWindow.scss";

interface ChatWindowProps {
  conversation: IConversationLocal;
  showInfo: boolean;
  onToggleInfo: () => void;
}

export interface ISendMessagePayload {
  text: string;
  images: { id: string; file: File; url: string }[];
  replyTo?: {
    id: string;
    senderId: string;
    content: string;
    type: "text" | "image" | "voice" | "video";
  };
}

export interface IDroppedFile {
  id: string;
  file: File;
  url: string;
}

const ACCEPTED_MEDIA_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "video/mp4", "video/quicktime",
];

const ChatWindow = ({ conversation, showInfo, onToggleInfo }: ChatWindowProps) => {
  // ---- Fetch messages from API via useInfiniteQuery ----
  const {
    data: messagesData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useMessages(conversation.id);

  // Flatten pages into a single array (API returns newest first, reverse for chat UI)
  // useMemo: stabilize array reference — only recompute when pages data actually changes
  const messages: IMessage[] = useMemo(
    () => (messagesData?.pages ? messagesData.pages.flatMap((page) => page.items).reverse() : []),
    [messagesData?.pages],
  );

  // ---- Check block status ----
  const { data: blockStatus } = useQuery({
    queryKey: ["block-status", conversation.otherUserId],
    queryFn: async () => {
      if (!conversation.otherUserId) return { isBlockedByMe: false, isBlockedByThem: false };
      const res = await checkBlockStatus(conversation.otherUserId);
      return res.data.data;
    },
    enabled: !!conversation.otherUserId,
    staleTime: 30 * 1000,
  });

  const isBlocked = (blockStatus?.isBlockedByMe || blockStatus?.isBlockedByThem) ?? false;

  // ---- Drag & drop state ----
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [droppedFiles, setDroppedFiles] = useState<IDroppedFile[]>([]);
  const dragCounterRef = useRef(0);

  // ============================================================================
  // DRAG & DROP HANDLERS
  // ============================================================================

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes("Files")) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDraggingOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((file) => ACCEPTED_MEDIA_TYPES.includes(file.type));

    if (imageFiles.length === 0) return;

    const newFiles: IDroppedFile[] = imageFiles.map((file) => ({
      id: `drop-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      url: URL.createObjectURL(file),
    }));

    setDroppedFiles(newFiles);
  }, []);

  const clearDroppedFiles = useCallback(() => {
    setDroppedFiles([]);
  }, []);

  return (
    <ChatThemeProvider
      themeId={conversation.themeId}
      className={`chat-window ${isDraggingOver ? "chat-window--drag-over" : ""}`}
      style={{ display: "flex", flexDirection: "column", flex: 1, width: "100%", height: "100%", minHeight: 0 }}
    >
      <Flex
        vertical
        id="chatWindow"
        flex={1}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{ width: "100%", height: "100%", minHeight: 0 }}
      >
        <ChatHeader conversation={conversation} showInfo={showInfo} onToggleInfo={onToggleInfo} />
        <MessageList
          conversationId={conversation.id}
          conversationType={conversation.type}
          messages={messages}
          isLoading={isLoading}
          isFetchingMore={isFetchingNextPage}
          hasMoreMessages={!!hasNextPage}
          onLoadMore={fetchNextPage}
          droppedFiles={droppedFiles}
          onClearDroppedFiles={clearDroppedFiles}
          isBlocked={isBlocked}
          quickEmoji={conversation.quickEmoji}
        />

        {/* Drag overlay */}
        {isDraggingOver && (
          <div className="chat-window__drop-overlay">
            <div className="chat-window__drop-zone">
              <div className="chat-window__drop-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="chat-window__drop-text">Thả file vào đây</p>
              <p className="chat-window__drop-hint">Hỗ trợ JPG, PNG, GIF, WebP, MP4</p>
            </div>
          </div>
        )}
      </Flex>
    </ChatThemeProvider>
  );
};

export default ChatWindow;
