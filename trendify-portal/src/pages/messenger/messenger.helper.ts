import { TMessageType } from "@/interfaces/message.interface";

export const getFormattedLastMessage = (msg: string | { content: string; type: TMessageType }) => {
  if (typeof msg === "string") return msg;
  const { type, content } = msg;
  switch (type) {
    case "text":
      return content;
    case "image":
      return "đã gửi ảnh";
    case "video":
      return "đã gửi video";
    case "voice":
      return "đã gửi 1 tin nhắn thoại";
    case "file":
    default:
      return "đã gửi file";
  }
};
