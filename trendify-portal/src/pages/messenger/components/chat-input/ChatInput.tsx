import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { Flex, Input, Image, Popover } from "antd";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";

import { CloseCircleIcon, PlusIcon } from "@/assets/icons/Icon";
import type { IDroppedFile } from "../chat-window/ChatWindow";
import type { IMessage } from "@/stores/chat/constants";

import "./ChatInput.scss";
import Icon from "@/components/icon/Icon";

const { TextArea } = Input;

const StopIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);


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
  onSendVoice?: (blob: Blob) => void;
  droppedFiles?: IDroppedFile[];
  onClearDroppedFiles?: () => void;
  replyingTo?: IMessage | null;
  onCancelReply?: () => void;
  quickEmoji?: string;
}

const ChatInput = ({ onSend, onSendVoice, droppedFiles, onClearDroppedFiles, replyingTo, onCancelReply, quickEmoji = "👍" }: ChatInputProps) => {
  const [message, setMessage] = useState("");
  const [selectedImages, setSelectedImages] = useState<{ id: string; file: File; url: string }[]>(
    [],
  );
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const hasImages = selectedImages.length > 0;
  const hasContent = message.trim().length > 0 || hasImages;

  const handleSend = useCallback(() => {
    const text = message.trim();
    const images = selectedImages;
    if (!text && images.length === 0 && !isRecording) return;

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
  }, [message, selectedImages, isRecording, onSend, replyingTo]);

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

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // TODO: Send audioBlob or convert to desired format
        console.log("Recording stopped, chunks:", audioChunksRef.current.length);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone permission denied:", err);
      // Could show a notification here
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
  }, []);

  const cancelRecording = useCallback(() => {
    audioChunksRef.current = []; // Discard audio
    stopRecording();
  }, [stopRecording]);

  const sendRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    // Wait a tick for onstop to fire and collect chunks
    setTimeout(() => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      if (onSendVoice && audioBlob.size > 0) {
        onSendVoice(audioBlob);
      }
      stopRecording();
    }, 100);
  }, [stopRecording, onSendVoice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // ============================================================================
  // RENDER: VOICE RECORDING MODE
  // ============================================================================
  if (isRecording) {
    return (
      <Flex className="chat-input chat-input--recording" align="center" gap={8} id="chatInput">
        {/* Cancel */}
        <Flex
          className="chat-input__recording-cancel"
          align="center"
          justify="center"
          onClick={cancelRecording}
        >
          <CloseCircleIcon style={{ width: 24, height: 24 }} />
        </Flex>

        {/* Stop */}
        <Flex
          className="chat-input__recording-stop"
          align="center"
          justify="center"
          onClick={sendRecording}
        >
          <StopIcon />
        </Flex>

        {/* Waveform / Progress bar */}
        <Flex className="chat-input__recording-bar" flex={1} align="center">
          <div className="chat-input__recording-progress">
            <div
              className="chat-input__recording-wave"
              style={{
                animation: "recording-pulse 1.5s ease-in-out infinite",
              }}
            />
          </div>
        </Flex>

        {/* Duration */}
        <Flex className="chat-input__recording-timer" align="center" justify="center">
          <span>{formatDuration(recordingDuration)}</span>
        </Flex>

        {/* Send */}
        <Flex
          className="chat-input__send chat-input__send--active"
          align="center"
          justify="center"
          onClick={sendRecording}
        >
          <Icon name="SendBlackIcon" size={22} />
        </Flex>
      </Flex>
    );
  }

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
              Đang trả lời {replyingTo.isMine ? "chính mình" : (replyingTo.sender?.displayName ?? replyingTo.senderId)}
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
              onClick={startRecording}
            >
              <Icon name="MicIcon" size={24} />
            </Flex>
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
              onChange={(e) => setMessage(e.target.value)}
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
