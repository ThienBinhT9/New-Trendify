import { memo, useState } from "react";
import { Flex, Dropdown, MenuProps, Tooltip, Popover, Image } from "antd";
import type { IMessage, IMessageReaction } from "@/stores/chat/constants";

import "./MessageBubble.scss";

// Position within a consecutive group of same-sender messages
export type BubblePosition = "single" | "first" | "middle" | "last";

interface MessageBubbleProps {
  message: IMessage;
  showRelativeTime?: boolean;
  position?: BubblePosition;
  onReply?: (message: IMessage) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onRetry?: (message: IMessage) => void;
  onCancel?: (message: IMessage) => void;
}

const actionItems: MenuProps["items"] = [
  { key: "reply", label: "Trả lời" },
  { key: "forward", label: "Chuyển tiếp" },
  { key: "copy", label: "Sao chép" },
  { type: "divider" },
  { key: "delete", label: "Xóa", danger: true },
];

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

const formatTooltipTime = (createdAt: string): string => {
  const d = new Date(createdAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())} - ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
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
        <Flex className="message-bubble__status message-bubble__status--sending" align="center" gap={4}>
          <span className="message-bubble__status-spinner" />
          <span className="message-bubble__status-text">Đang gửi</span>
        </Flex>
      );
    }

    if (status === "failed") {
      return (
        <Flex className="message-bubble__status message-bubble__status--failed" align="center" gap={6}>
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
          <Dropdown
            menu={{ items: actionItems }}
            trigger={["click"]}
            placement={isMine ? "bottomRight" : "bottomLeft"}
          >
            <Flex
              className="message-bubble__actions-btn"
              align="center"
              justify="center"
              title="Xem thêm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </Flex>
          </Dropdown>
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
const QuotedReply = memo(({ replyTo, isMine }: { replyTo?: IMessage; isMine: boolean }) => {
  if (!replyTo) return null;

  const senderName = replyTo.sender?.displayName ?? replyTo.senderId;
  let contentPreview = replyTo.content ?? "";
  if (replyTo.type === "image") contentPreview = "📷 Ảnh";
  if (replyTo.type === "voice") contentPreview = "🎤 Tin nhắn thoại";
  if (replyTo.type === "video") contentPreview = "🎬 Video";

  return (
    <Flex
      className={`message-bubble__quoted ${isMine ? "message-bubble__quoted--mine" : "message-bubble__quoted--other"}`}
      vertical
      gap={2}
    >
      <span className="message-bubble__quoted-label">↩ Trả lời {senderName}</span>
      <span className="message-bubble__quoted-content">{contentPreview}</span>
    </Flex>
  );
});
QuotedReply.displayName = "QuotedReply";

// ============================================================================
// Reactions display (shown below the message content)
// ============================================================================
const ReactionsBar = memo(({ reactions }: { reactions?: IMessageReaction[] }) => {
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
    <Flex className="message-bubble__reactions" gap={4} wrap="wrap">
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
});
ReactionsBar.displayName = "ReactionsBar";

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const MessageBubble = memo(
  ({
    message,
    showRelativeTime = false,
    position = "single",
    onReply,
    onReact,
    onRetry,
    onCancel,
  }: MessageBubbleProps) => {
    const { isMine, type, content, mediaUrls, localMediaUrls, createdAt, replyTo, reactions, status } =
      message;

    // Use localMediaUrls for optimistic preview, fall back to server-resolved mediaUrls
    const effectiveMediaUrls = localMediaUrls && localMediaUrls.length > 0 ? localMediaUrls : mediaUrls;
    const isSending = status === "sending";
    const isFailed = status === "failed";

    const tooltipTitle = formatTooltipTime(createdAt);
    const positionClass = `message-bubble--pos-${position}`;
    const statusClass = isSending ? "message-bubble--sending" : isFailed ? "message-bubble--failed" : "";
    const bubbleClass = `message-bubble ${isMine ? "message-bubble--mine" : "message-bubble--other"} ${positionClass} ${statusClass}`;

    const handleReply = () => onReply?.(message);
    const handleReact = (emoji: string) => onReact?.(message.id, emoji);

    const renderBottom = () => (
      <>
        <ReactionsBar reactions={reactions} />
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
      return (
        <ActionButtons isMine={side === "mine"} onReply={handleReply} onReact={handleReact} />
      );
    };

    // ---- Voice ----
    if (type === "voice") {
      const voiceUrl = effectiveMediaUrls?.[0] ?? "";

      return (
        <Flex className={bubbleClass} justify={isMine ? "flex-end" : "flex-start"}>
          <Flex vertical gap={4} className="message-bubble__wrapper">
            <QuotedReply replyTo={replyTo} isMine={!!isMine} />
            <Tooltip
              title={tooltipTitle}
              placement={isMine ? "left" : "right"}
              mouseEnterDelay={0.4}
            >
              <Flex align="center" gap={8} className="message-bubble__inner-row">
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
              </Flex>
            </Tooltip>
            {renderBottom()}
          </Flex>
        </Flex>
      );
    }

    // ---- Image ----
    if (type === "image" && effectiveMediaUrls && effectiveMediaUrls.length > 0) {
      const isMultiple = effectiveMediaUrls.length > 1;

      return (
        <Flex className={bubbleClass} justify={isMine ? "flex-end" : "flex-start"}>
          <Flex vertical gap={8} className="message-bubble__wrapper">
            <QuotedReply replyTo={replyTo} isMine={!!isMine} />
            <Tooltip
              title={tooltipTitle}
              placement={isMine ? "left" : "right"}
              mouseEnterDelay={0.4}
            >
              <Flex align="center" gap={8} className="message-bubble__inner-row">
                {isMine && renderActionBtns("mine")}
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
                {!isMine && renderActionBtns("other")}
              </Flex>
            </Tooltip>
            {renderBottom()}
          </Flex>
        </Flex>
      );
    }

    // ---- Video ----
    if (type === "video") {
      const videoUrl = effectiveMediaUrls?.[0] ?? "";

      return (
        <Flex className={bubbleClass} justify={isMine ? "flex-end" : "flex-start"}>
          <Flex vertical gap={4} className="message-bubble__wrapper">
            <QuotedReply replyTo={replyTo} isMine={!!isMine} />
            <Tooltip
              title={tooltipTitle}
              placement={isMine ? "left" : "right"}
              mouseEnterDelay={0.4}
            >
              <Flex align="center" gap={8} className="message-bubble__inner-row">
                {isMine && renderActionBtns("mine")}
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
                {!isMine && renderActionBtns("other")}
              </Flex>
            </Tooltip>
            {renderBottom()}
          </Flex>
        </Flex>
      );
    }

    // ---- Text (default) ----
    return (
      <Flex className={bubbleClass} justify={isMine ? "flex-end" : "flex-start"}>
        <Flex vertical gap={4} className="message-bubble__wrapper">
          <QuotedReply replyTo={replyTo} isMine={!!isMine} />
          <Tooltip title={tooltipTitle} placement={isMine ? "left" : "right"} mouseEnterDelay={0.4}>
            <Flex align="center" gap={8} className="message-bubble__inner-row">
              {isMine && renderActionBtns("mine")}
              <div className="message-bubble__content">{content}</div>
              {!isMine && renderActionBtns("other")}
            </Flex>
          </Tooltip>
          {renderBottom()}
        </Flex>
      </Flex>
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.reactions === next.message.reactions &&
    prev.message.status === next.message.status &&
    prev.position === next.position &&
    prev.showRelativeTime === next.showRelativeTime,
);
MessageBubble.displayName = "MessageBubble";

export default MessageBubble;

