import type { IConversation, EMessageType } from "@/stores/chat/constants";
import type { IConversationLocal } from "../components/chat-sidebar/ChatSidebar";
import { getAvatarUrl } from "@/utils/common.util";
import type { TMessageType } from "@/interfaces/message.interface";

// ============================================================================
// Map API IConversation → UI IConversationLocal
// ============================================================================

const mapMessageType = (type: EMessageType): TMessageType => {
  const map: Record<string, TMessageType> = {
    text: "text",
    image: "image",
    video: "video",
    voice: "voice",
    file: "file",
  };
  return map[type] ?? "text";
};

const formatConversationTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    // Today — show time
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) {
    // This week — show day name
    return date.toLocaleDateString("vi-VN", { weekday: "short" });
  }
  // Older — show date
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "short" });
};

export const mapConversationToLocal = (
  conv: IConversation,
  currentUserId: string,
): IConversationLocal => {
  // For DM: use other user's info. For group: use conversation name
  const isDirect = conv.type === "direct";
  const otherUser = conv.otherUser;

  const name = isDirect
    ? (conv.settings?.nicknames?.[otherUser?.id ?? ""] ?? otherUser?.displayName ?? "Unknown")
    : (conv.name ?? "Nhóm chat");

  const defaultGroupAvatar = "https://cdn-icons-png.flaticon.com/512/615/615075.png";
  const avatar = isDirect ? getAvatarUrl(otherUser?.profilePicture) : (conv.avatarUrl || defaultGroupAvatar);

  // Find current user's membership for isPinned
  const myMembership = conv.members.find((m) => m.userId === currentUserId);

  // Map lastMessage
  const lastMessage = conv.lastMessage
    ? {
        content: conv.lastMessage.content,
        type: mapMessageType(conv.lastMessage.type),
      }
    : "";

  const time = conv.lastMessage
    ? formatConversationTime(conv.lastMessage.createdAt)
    : formatConversationTime(conv.updatedAt);

  return {
    id: conv.id,
    type: conv.type,
    name,
    avatar,
    lastMessage,
    time,
    unread: conv.unreadCount ?? 0,
    isOnline: false, // Will be updated via Socket.IO presence
    isPinned: myMembership?.isPinned ?? false,
    updatedAt: new Date(conv.updatedAt).getTime(),
    otherUserId: isDirect ? otherUser?.id : undefined,
    memberCount: conv.members.length,
    // Settings
    themeId: conv.settings?.themeId,
    quickEmoji: conv.settings?.quickEmoji,
    nicknames: conv.settings?.nicknames,
  };
};

export const mapConversationsToLocal = (
  conversations: IConversation[],
  currentUserId: string,
): IConversationLocal[] => {
  return conversations.map((conv) => mapConversationToLocal(conv, currentUserId));
};
