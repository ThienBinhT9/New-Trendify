import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Flex, Input, Image, Popover } from "antd";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";

import { CloseCircleIcon, PlusIcon } from "@/assets/icons/Icon";
import type { IDroppedFile } from "../chat-window/ChatWindow";
import type { IMessage } from "@/stores/chat/constants";

import "./ChatInput.scss";
import Icon from "@/components/icon/Icon";

const { TextArea } = Input;

// ============================================================================
// COMPONENT
// ============================================================================
interface ISendPayload {
  text: string;
  images: { id: string; file: File; url: string }[];
  replyTo?: { id: string; senderId: string; content?: string; type: string };
}

interface ChatInputProps {
  onSend: (payload: ISendPayload) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  droppedFiles?: IDroppedFile[];
  onClearDroppedFiles?: () => void;
  replyingTo?: IMessage | null;
  onCancelReply?: () => void;
  quickEmoji?: string;
}

const ChatInput = ({
  onSend,
  onTyping,
  onStopTyping,
  droppedFiles,
  onClearDroppedFiles,
  replyingTo,
  onCancelReply,
  quickEmoji = "👍",
}: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState<{ id: string; file: File; url: string }[]>(
    [],
  );
  const [emojiOpen, setEmojiOpen] = useState(false);

  // Typing indicator debounce
  const isTypingRef = useRef(false);
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitTypingStart = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTyping?.();
    }
    // Reset the stop timer on every keystroke
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onStopTyping?.();
    }, 2000);
  }, [onTyping, onStopTyping]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    };
  }, []);

  // Consume dropped files from drag/drop on ChatWindow
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      setSelectedImages((prev) => [...prev, ...droppedFiles]);
      onClearDroppedFiles?.();
      inputRef.current?.focus();
    }
  }, [droppedFiles, onClearDroppedFiles]);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasImages = selectedImages.length > 0;
  const hasContent = message.trim().length > 0 || hasImages;

  const handleSend = useCallback(() => {
    const text = message.trim();
    const images = selectedImages;
    if (!text && images.length === 0) return;

    // Stop typing immediately on send
    if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      onStopTyping?.();
    }

    onSend({
      text: message,
      images,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            senderId: replyingTo.senderId,
            content: replyingTo.content,
            type: replyingTo.type,
          }
        : undefined,
    });

    setMessage("");
    setSelectedImages([]);
    inputRef.current?.focus();
  }, [message, selectedImages, onSend, replyingTo]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Ignore Enter during IME composition (Vietnamese input, etc.)
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter → default behavior (newline) is preserved
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      url: URL.createObjectURL(file),
    }));

    setSelectedImages((prev) => [...prev, ...newImages]);
    e.target.value = "";
  };

  const handleRemoveImage = (id: string) => {
    setSelectedImages((prev) => {
      const removed = prev.find((img) => img.id === id);
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((img) => img.id !== id);
    });
  };

  useEffect(() => {
    return () => {
      selectedImages.forEach((img) => URL.revokeObjectURL(img.url));
    };
  }, []);

  // ============================================================================
  // RENDER: NORMAL / WITH IMAGES MODE
  // ============================================================================
  return (
    <Flex vertical className="chat-input" id="chatInput">
      {/* Reply preview bar */}
      {replyingTo && (
        <Flex className="chat-input__reply-bar" align="center" justify="space-between">
          <Flex vertical gap={2} className="chat-input__reply-info">
            <span className="chat-input__reply-label">
              Đang trả lời{" "}
              {replyingTo.isMine
                ? "chính mình"
                : (replyingTo.sender?.displayName ?? replyingTo.senderId)}
            </span>
            <span className="chat-input__reply-content">
              {replyingTo.type === "image"
                ? "📷 Ảnh"
                : replyingTo.type === "voice"
                  ? "🎤 Tin nhắn thoại"
                  : replyingTo.type === "video"
                    ? "🎬 Video"
                    : replyingTo.content}
            </span>
          </Flex>
          <Flex
            className="chat-input__reply-close"
            align="center"
            justify="center"
            onClick={onCancelReply}
          >
            <CloseCircleIcon style={{ width: 18, height: 18 }} />
          </Flex>
        </Flex>
      )}

      {/* Image Preview Area (only when images selected) */}

      {/* Bottom Input Row */}
      <Flex className="chat-input__row" align="center" gap={8}>
        {/* Left Action Icons */}
        {!hasImages ? (
          <Flex className="chat-input__left-icons" align="center" gap={2}>
            <Flex
              className="chat-input__icon-btn"
              align="center"
              justify="center"
              onClick={handleImageClick}
            >
              <Icon name="ImagePenIcon" size={24} />
            </Flex>
          </Flex>
        ) : null}

        {/* Input Field */}
        <Flex vertical flex={1}>
          {hasImages && (
            <Flex className="chat-input__images-area" align="center" gap={10}>
              {/* Add more images button */}
              <Flex
                className="chat-input__images-add"
                align="center"
                justify="center"
                onClick={handleImageClick}
              >
                <PlusIcon style={{ width: 20, height: 20 }} />
              </Flex>

              {/* Image thumbnails */}
              <Flex className="chat-input__images-list" gap={10} align="center">
                <Image.PreviewGroup>
                  {selectedImages.map((img) => (
                    <div key={img.id} className="chat-input__image-thumb">
                      <Image
                        src={img.url}
                        alt="preview"
                        width={46}
                        height={46}
                        className="chat-input__image-thumb-img"
                        preview={{ mask: null }}
                      />
                      <Flex
                        className="chat-input__image-thumb-close"
                        align="center"
                        justify="center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(img.id);
                        }}
                      >
                        <Icon name="CloseIcon" />
                      </Flex>
                    </div>
                  ))}
                </Image.PreviewGroup>
              </Flex>
            </Flex>
          )}
          <Flex flex={1} className="chat-input__field" align="center" gap={4}>
            <TextArea
              ref={inputRef as React.Ref<any>}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim().length > 0) {
                  emitTypingStart();
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
              className="chat-input__input"
              variant="borderless"
              autoSize={{ minRows: 1, maxRows: 5 }}
            />
            <Popover
              open={emojiOpen}
              onOpenChange={setEmojiOpen}
              trigger="click"
              placement="topRight"
              arrow={false}
              overlayClassName="chat-input__emoji-popover"
              content={
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  width={320}
                  height={360}
                  searchPlaceHolder="Tìm kiếm emoji"
                  previewConfig={{ showPreview: false }}
                  emojiStyle={EmojiStyle.NATIVE}
                />
              }
            >
              <Flex className="chat-input__emoji-btn" align="center" justify="center">
                <Icon name="EmojiIcon" size={22} />
              </Flex>
            </Popover>
          </Flex>
        </Flex>

        {/* Right: Send or Like */}
        {hasContent ? (
          <Flex
            className="chat-input__send chat-input__send--active"
            align="center"
            justify="center"
            onClick={handleSend}
          >
            <Icon name="SendBlackIcon" size={22} />
          </Flex>
        ) : (
          <Flex
            className="chat-input__like"
            align="center"
            justify="center"
            onClick={() => onSend({ text: quickEmoji, images: [] })}
          >
            <span style={{ fontSize: 24, lineHeight: 1 }}>{quickEmoji}</span>
          </Flex>
        )}
      </Flex>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/mp4,video/quicktime"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
    </Flex>
  );
};

export default ChatInput;
