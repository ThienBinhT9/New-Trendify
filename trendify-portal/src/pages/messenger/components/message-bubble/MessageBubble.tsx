import { memo, useState } from "react";
import { Avatar, Flex, Popover, Image } from "antd";
import type { IMessage, IMessageReaction } from "@/stores/chat/constants";
import { getAvatarUrl } from "@/utils/common.util";

import "./MessageBubble.scss";

// Position within a consecutive group of same-sender messages
export type BubblePosition = "single" | "first" | "middle" | "last";

interface MessageBubbleProps {
  message: IMessage;
  currentUserId?: string;
  showRelativeTime?: boolean;
  position?: BubblePosition;
  isGroupConversation?: boolean;
  /** Show avatar beside this bubble (last/single in a run) */
  showAvatar?: boolean;
  /** Show sender name above this bubble (first/single in a run) */
  showSenderName?: boolean;
  onReply?: (message: IMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRetry?: (message: IMessage) => void;
  onCancel?: (message: IMessage) => void;
}

const formatRelativeTime = (createdAt: string): string => {
  const diff = Date.now() - new Date(createdAt).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Đã gửi vài giây trước";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Đã gửi ${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Đã gửi ${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `Đã gửi ${days} ngày trước`;
};

// Quick reactions
const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

// ============================================================================
// Status Indicator sub-component
// ============================================================================
const StatusIndicator = memo(
  ({
    status,
    onRetry,
    onCancel,
  }: {
    status?: "sending" | "sent" | "failed";
    onRetry?: () => void;
    onCancel?: () => void;
  }) => {
    if (!status || status === "sent") return null;

    if (status === "sending") {
      return (
        <Flex
          className="message-bubble__status message-bubble__status--sending"
          align="center"
          gap={4}
        >
          <span className="message-bubble__status-spinner" />
          <span className="message-bubble__status-text">Đang gửi</span>
        </Flex>
      );
    }

    if (status === "failed") {
      return (
        <Flex
          className="message-bubble__status message-bubble__status--failed"
          align="center"
          gap={6}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span className="message-bubble__status-text">Gửi thất bại</span>
          <span className="message-bubble__status-action" onClick={onRetry}>
            Thử lại
          </span>
          <span className="message-bubble__status-divider">·</span>
          <span className="message-bubble__status-action" onClick={onCancel}>
            Xóa
          </span>
        </Flex>
      );
    }

    return null;
  },
);
StatusIndicator.displayName = "StatusIndicator";

// ============================================================================
// Action Buttons sub-component
// ============================================================================
const ActionButtons = memo(
  ({
    isMine,
    onReply,
    onReact,
  }: {
    isMine: boolean;
    onReply?: () => void;
    onReact?: (emoji: string) => void;
  }) => {
    const [reactionOpen, setReactionOpen] = useState(false);

    return (
      <div className="message-bubble__actions">
        <Flex gap={4}>
          <Flex
            className="message-bubble__actions-btn"
            align="center"
            justify="center"
            title="Trả lời"
            onClick={onReply}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 9V5L3 12L10 19V14.9C15 14.9 18.5 16.5 21 20C20 15 17 10 10 9Z" />
            </svg>
          </Flex>
          <Popover
            open={reactionOpen}
            onOpenChange={setReactionOpen}
            trigger="click"
            placement={isMine ? "bottomRight" : "bottomLeft"}
            arrow={false}
            overlayClassName="message-bubble__reaction-popover"
            content={
              <Flex className="message-bubble__reaction-picker" gap={2}>
                {QUICK_REACTIONS.map((emoji) => (
                  <span
                    key={emoji}
                    className="message-bubble__reaction-emoji"
                    onClick={() => {
                      onReact?.(emoji);
                      setReactionOpen(false);
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </Flex>
            }
          >
            <Flex
              className="message-bubble__actions-btn"
              align="center"
              justify="center"
              title="Cảm xúc"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            </Flex>
          </Popover>
        </Flex>
      </div>
    );
  },
);
ActionButtons.displayName = "ActionButtons";

// ============================================================================
// Quoted reply block (shown above the main message content)
// ============================================================================
const QuotedReply = memo(
  ({
    replyTo,
    isMine,
    currentUserId,
  }: {
    replyTo?: IMessage;
    isMine: boolean;
    currentUserId?: string;
  }) => {
    if (!replyTo) return null;

    let contentPreview = replyTo.content ?? "";
    if (replyTo.type === "image") contentPreview = "📷 Ảnh";
    if (replyTo.type === "voice") contentPreview = "🎤 Tin nhắn thoại";
    if (replyTo.type === "video") contentPreview = "🎬 Video";

    // replyTo.isMine is set by the API mapper. As fallback, compare senderId.
    const replyToIsMe =
      replyTo.isMine === true || (currentUserId ? replyTo.senderId === currentUserId : false);
    const targetName = replyToIsMe ? "bạn" : (replyTo.sender?.displayName ?? replyTo.senderId);
    const labelText = isMine ? `Bạn đã trả lời ${targetName}` : `Đã trả lời ${targetName}`;

    return (
      <Flex
        className={`message-bubble__quoted-container ${isMine ? "message-bubble__quoted-container--mine" : "message-bubble__quoted-container--other"}`}
        vertical
        gap={4}
      >
        <Flex className="message-bubble__quoted-header" gap={6} align="center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 9V5L3 12L10 19V14.9C15 14.9 18.5 16.5 21 20C20 15 17 10 10 9Z" />
          </svg>
          <span className="message-bubble__quoted-label">{labelText}</span>
        </Flex>
        <div
          className={`message-bubble__quoted-bubble ${isMine ? "message-bubble__quoted-bubble--mine" : "message-bubble__quoted-bubble--other"}`}
        >
          <span className="message-bubble__quoted-content">{contentPreview}</span>
        </div>
      </Flex>
    );
  },
);
QuotedReply.displayName = "QuotedReply";

// ============================================================================
// Reactions display (shown below the message content)
// ============================================================================
const ReactionsBar = memo(
  ({ reactions, isMine }: { reactions?: IMessageReaction[]; isMine?: boolean }) => {
    if (!reactions || reactions.length === 0) return null;

    // Group reactions by emoji
    const grouped = reactions.reduce(
      (acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = [];
        acc[r.emoji].push(r.userId);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    return (
      <Flex
        className={`message-bubble__reactions ${isMine ? "message-bubble__reactions--mine" : "message-bubble__reactions--other"}`}
        gap={4}
        wrap="wrap"
      >
        {Object.entries(grouped).map(([emoji, userIds]) => (
          <span key={emoji} className="message-bubble__reactions-chip">
            {emoji}{" "}
            {userIds.length > 1 && (
              <span className="message-bubble__reactions-count">{userIds.length}</span>
            )}
          </span>
        ))}
      </Flex>
    );
  },
);
ReactionsBar.displayName = "ReactionsBar";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const MessageBubble = memo(
  ({
    message,
    currentUserId,
    showRelativeTime = false,
    position = "single",
    isGroupConversation = false,
    showAvatar = false,
    showSenderName = false,
    onReply,
    onReact,
    onRetry,
    onCancel,
  }: MessageBubbleProps) => {
    const {
      isMine,
      type,
      content,
      mediaUrls,
      localMediaUrls,
      createdAt,
      replyTo,
      reactions,
      status,
    } = message;

    // Use localMediaUrls for optimistic preview, fall back to server-resolved mediaUrls
    const effectiveMediaUrls =
      localMediaUrls && localMediaUrls.length > 0 ? localMediaUrls : mediaUrls;
    const isSending = status === "sending";
    const isFailed = status === "failed";

    const positionClass = `message-bubble--pos-${position}`;
    const statusClass = isSending
      ? "message-bubble--sending"
      : isFailed
        ? "message-bubble--failed"
        : "";
    const bubbleClass = `message-bubble ${isMine ? "message-bubble--mine" : "message-bubble--other"} ${positionClass} ${statusClass}`;

    const handleReply = () => onReply?.(message);
    const handleReact = (emoji: string) => onReact?.(message.id, emoji);

    const renderBottom = () => (
      <>
        {isFailed ? (
          <StatusIndicator
            status="failed"
            onRetry={() => onRetry?.(message)}
            onCancel={() => onCancel?.(message)}
          />
        ) : isSending ? (
          <StatusIndicator status="sending" />
        ) : showRelativeTime && isMine ? (
          <span className="message-bubble__relative-time">{formatRelativeTime(createdAt)}</span>
        ) : null}
      </>
    );

    const renderActionBtns = (side: "mine" | "other") => {
      // Don't show actions for optimistic messages
      if (isSending || isFailed) return null;
      return <ActionButtons isMine={side === "mine"} onReply={handleReply} onReact={handleReact} />;
    };

    // ---- Group conversation: sender avatar + name ----
    const senderAvatarUrl = getAvatarUrl(message.sender?.profilePicture);
    const senderName = message.sender?.displayName ?? "";

    const wrapWithGroupLayout = (content: React.ReactNode) => {
      if (!isGroupConversation || isMine) return <>{content}</>;
      return (
        <Flex align="flex-end" style={{ paddingLeft: 4 }}>
          {/* Avatar column — fixed 32px wide, always present to keep alignment */}
          <div style={{ width: 36, flexShrink: 0, marginRight: 8, marginBottom: 2 }}>
            {showAvatar ? (
              <Avatar
                src={senderAvatarUrl}
                size={32}
                style={{ border: "2px solid var(--gray-200)", display: "block" }}
              >
                {!senderAvatarUrl && senderName.charAt(0).toUpperCase()}
              </Avatar>
            ) : null}
          </div>

          {/* Bubble column — flex:1 + minWidth:0 essential to prevent letter wrapping */}
          <Flex vertical gap={3} style={{ flex: 1, minWidth: 0, maxWidth: "calc(100% - 44px)" }}>
            {showSenderName && senderName && (
              <span className="message-bubble__group-sender-name">{senderName}</span>
            )}
            {content}
          </Flex>
        </Flex>
      );
    };

    // ---- Voice ----
    if (type === "voice") {
      const voiceUrl = effectiveMediaUrls?.[0] ?? "";

      return wrapWithGroupLayout(
        <Flex className={bubbleClass} justify={isMine ? "flex-end" : "flex-start"}>
          <Flex vertical gap={4} className="message-bubble__wrapper">
            <QuotedReply replyTo={replyTo} isMine={!!isMine} currentUserId={currentUserId} />
            <Flex
              align="center"
              gap={8}
              className={`message-bubble__inner-row ${reactions && reactions.length > 0 ? "message-bubble__inner-row--has-reactions" : ""}`}
            >
              {isMine && renderActionBtns("mine")}
              <Flex
                align="center"
                gap={10}
                className="message-bubble__voice"
                style={{ padding: "8px 12px" }}
              >
                <audio
                  controls
                  src={voiceUrl}
                  style={{ height: 40, width: 240, outline: "none" }}
                />
              </Flex>
              {!isMine && renderActionBtns("other")}
              <ReactionsBar reactions={reactions} isMine={!!isMine} />
            </Flex>
            {renderBottom()}
          </Flex>
        </Flex>,
      );
    }

    // ---- Image ----
    if (type === "image" && effectiveMediaUrls && effectiveMediaUrls.length > 0) {
      const isMultiple = effectiveMediaUrls.length > 1;

      return wrapWithGroupLayout(
        <Flex className={bubbleClass} justify={isMine ? "flex-end" : "flex-start"}>
          <Flex vertical gap={8} className="message-bubble__wrapper">
            <QuotedReply replyTo={replyTo} isMine={!!isMine} currentUserId={currentUserId} />
            <Flex
              align="center"
              gap={8}
              className={`message-bubble__inner-row ${reactions && reactions.length > 0 ? "message-bubble__inner-row--has-reactions" : ""}`}
            >
              {isMine && renderActionBtns("mine")}
              <Flex vertical gap={6}>
                <Image.PreviewGroup items={effectiveMediaUrls}>
                  <div
                    className={`message-bubble__image-container ${isMultiple ? "message-bubble__image-container--multiple" : ""}`}
                  >
                    <div className="message-bubble__image-stack-wrapper">
                      {isMultiple && (
                        <>
                          <div className="message-bubble__image-stack-layer message-bubble__image-stack-layer--1" />
                          <div className="message-bubble__image-stack-layer message-bubble__image-stack-layer--2" />
                        </>
                      )}
                      <Image
                        src={effectiveMediaUrls[0]}
                        alt="shared"
                        loading="lazy"
                        className="message-bubble__image message-bubble__image--front"
                        preview={{ mask: null }}
                        style={{ cursor: "pointer" }}
                      />
                    </div>
                  </div>
                </Image.PreviewGroup>
              </Flex>
              {!isMine && renderActionBtns("other")}
              <ReactionsBar reactions={reactions} isMine={!!isMine} />
            </Flex>
            {renderBottom()}
          </Flex>
        </Flex>,
      );
    }

    // ---- Video ----
    if (type === "video") {
      const videoUrl = effectiveMediaUrls?.[0] ?? "";

      return wrapWithGroupLayout(
        <Flex className={bubbleClass} justify={isMine ? "flex-end" : "flex-start"}>
          <Flex vertical gap={4} className="message-bubble__wrapper">
            <QuotedReply replyTo={replyTo} isMine={!!isMine} currentUserId={currentUserId} />
            <Flex
              align="center"
              gap={8}
              className={`message-bubble__inner-row ${reactions && reactions.length > 0 ? "message-bubble__inner-row--has-reactions" : ""}`}
            >
              {isMine && renderActionBtns("mine")}
              <Flex vertical gap={6}>
                <div
                  className="message-bubble__image-container"
                  style={{ borderRadius: 16, overflow: "hidden", background: "#000" }}
                >
                  <video
                    src={videoUrl}
                    controls
                    preload="none"
                    style={{
                      display: "block",
                      maxWidth: 280,
                      maxHeight: 300,
                      width: "100%",
                      objectFit: "contain",
                    }}
                  />
                </div>
              </Flex>
              {!isMine && renderActionBtns("other")}
              <ReactionsBar reactions={reactions} isMine={!!isMine} />
            </Flex>
            {renderBottom()}
          </Flex>
        </Flex>,
      );
    }

    // ---- Text (default) ----
    return wrapWithGroupLayout(
      <Flex className={bubbleClass} justify={isMine ? "flex-end" : "flex-start"}>
        <Flex vertical gap={4} className="message-bubble__wrapper">
          <QuotedReply replyTo={replyTo} isMine={!!isMine} currentUserId={currentUserId} />
          <Flex
            align="center"
            gap={8}
            className={`message-bubble__inner-row ${reactions && reactions.length > 0 ? "message-bubble__inner-row--has-reactions" : ""}`}
          >
            {isMine && renderActionBtns("mine")}
            <div className="message-bubble__content">{content}</div>
            {!isMine && renderActionBtns("other")}
            <ReactionsBar reactions={reactions} isMine={!!isMine} />
          </Flex>
          {renderBottom()}
        </Flex>
      </Flex>,
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.reactions === next.message.reactions &&
    prev.message.status === next.message.status &&
    prev.position === next.position &&
    prev.showRelativeTime === next.showRelativeTime &&
    prev.showAvatar === next.showAvatar &&
    prev.showSenderName === next.showSenderName &&
    prev.isGroupConversation === next.isGroupConversation,
);
MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
