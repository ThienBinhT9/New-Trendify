import { useState } from "react";
import { Avatar, Flex, Typography, Modal, Input, Image, message, Button } from "antd";
import EmojiPicker, { EmojiClickData, EmojiStyle } from "emoji-picker-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { IConversationLocal } from "../chat-sidebar/ChatSidebar";
import { blockUser, unblockUser, checkBlockStatus } from "@/stores/follow/api";
import {
  deleteConversation,
  getGroupMembers,
  removeMember,
  leaveGroup,
  updateGroup,
  getConversationMedia,
} from "@/stores/chat/api";
import { conversationKeys } from "../../hooks/useConversations";
import { messageKeys } from "../../hooks/useMessages";
import { useUpdateConversationSettings } from "../../hooks/useConversationSettings";
import { useAppSelector } from "@/stores";

import "./ChatInfo.scss";
import Icon from "@/components/icon/Icon";
import { getAvatarUrl, DEFAULT_AVATAR_URL } from "@/utils/common.util";

const { Text } = Typography;

// ============================================================================
// ICONS
// ============================================================================

const ChevronUpIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

const LogOutIcon = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
    <polyline points="16 17 21 12 16 7"></polyline>
    <line x1="21" y1="12" x2="9" y2="12"></line>
  </svg>
);

const ChevronDownIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PaletteIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
    <circle cx="6.5" cy="12" r="0.5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
  </svg>
);

const EmojiIcon = () => (
  <svg
    width="20"
    height="20"
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
);

const CrownIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#fadb14"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const FileIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const PenIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const THEME_OPTIONS = [
  { id: "classic", name: "Cổ điển", color: "#0084ff" },
  { id: "sunset", name: "Hoàng hôn", color: "#FF6B6B" },
  { id: "forest", name: "Rừng xanh", color: "#51cf66" },
  { id: "ocean", name: "Đại dương", color: "#339af0" },
  { id: "lavender", name: "Oải hương", color: "#845ef7" },
  { id: "rose", name: "Hoa hồng", color: "#f06595" },
  { id: "midnight", name: "Nửa đêm", color: "#1e1e2e" },
  { id: "gold", name: "Vàng óng", color: "#fab005" },
];

// ============================================================================
// TYPES
// ============================================================================
type TInfoView = "main" | "media" | "members";
type TMediaTab = "image" | "video" | "file";
type TConfirmAction = "block" | "unblock" | "delete" | "leave" | null;
type TMemberAction = "remove" | null;

interface ChatInfoProps {
  conversation: IConversationLocal;
  onDeselectConversation: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================
const ChatInfo = ({ conversation, onDeselectConversation }: ChatInfoProps) => {
  const [customizeOpen, setCustomizeOpen] = useState(true);
  const [privacyOpen, setPrivacyOpen] = useState(true);

  const [currentView, setCurrentView] = useState<TInfoView>("main");
  const [mediaTab, setMediaTab] = useState<TMediaTab>("image");

  // Modal states
  const [themeModalOpen, setThemeModalOpen] = useState(false);
  const [emojiModalOpen, setEmojiModalOpen] = useState(false);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [renameGroupModalOpen, setRenameGroupModalOpen] = useState(false);
  const [renameGroupValue, setRenameGroupValue] = useState("");

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState<TConfirmAction>(null);

  // Group Member Action modal
  const [memberAction, setMemberAction] = useState<{ type: TMemberAction; member: any } | null>(
    null,
  );

  // Theme selection
  const [selectedTheme, setSelectedTheme] = useState(conversation.themeId || "classic");

  // Emoji selection
  const [selectedEmoji, setSelectedEmoji] = useState(conversation.quickEmoji || "👍");

  // Nickname editing
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");

  const currentUser = useAppSelector((state) => state.auth.user);

  // Settings Mutation
  const updateSettings = useUpdateConversationSettings(conversation.id);

  // React Query
  const queryClient = useQueryClient();

  // ---- Group Members Data ----
  const { data: membersList, isLoading: loadingMembers } = useQuery({
    queryKey: ["group-members", conversation.id],
    queryFn: async () => {
      if (conversation.type !== "group") return [];
      const res = await getGroupMembers(conversation.id);
      return res.data.data;
    },
    enabled: conversation.type === "group",
  });

  // ---- Conversation Media ----
  const { data: mediaData, isLoading: loadingMedia } = useQuery({
    queryKey: ["conversation-media", conversation.id, mediaTab],
    queryFn: async () => {
      const res = await getConversationMedia(conversation.id, { type: mediaTab, limit: 50 });
      return res.data.data as { items: any[]; cursor: string | null; hasNext: boolean };
    },
    enabled: currentView === "media",
    staleTime: 30 * 1000,
  });

  const myMemberInfo = membersList?.find((m: any) => m.userId === currentUser?.id);
  const myRole = myMemberInfo?.role || "member";
  const canManageRoles = myRole === "owner";

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

  const isBlockedByMe = blockStatus?.isBlockedByMe ?? false;

  // Handle emoji pick from library
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setSelectedEmoji(emojiData.emoji);
    updateSettings.mutate(
      { quickEmoji: emojiData.emoji },
      {
        onSuccess: () => setEmojiModalOpen(false),
      },
    );
  };

  const handleRemoveEmoji = () => {
    setSelectedEmoji("👍");
    updateSettings.mutate(
      { quickEmoji: "👍" },
      {
        onSuccess: () => setEmojiModalOpen(false),
      },
    );
  };

  // ---- Block user mutation ----
  const blockMutation = useMutation({
    mutationFn: () => {
      if (!conversation.otherUserId) throw new Error("No user to block");
      return blockUser(conversation.otherUserId);
    },
    onSuccess: () => {
      message.success(`Đã chặn ${conversation.name}`);
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      queryClient.invalidateQueries({ queryKey: ["block-status", conversation.otherUserId] });
      setConfirmAction(null);
      onDeselectConversation();
    },
    onError: () => {
      message.error("Không thể chặn người dùng. Vui lòng thử lại.");
    },
  });

  // ---- Unblock user mutation ----
  const unblockMutation = useMutation({
    mutationFn: () => {
      if (!conversation.otherUserId) throw new Error("No user to unblock");
      return unblockUser(conversation.otherUserId);
    },
    onSuccess: () => {
      message.success(`Đã bỏ chặn ${conversation.name}`);
      queryClient.invalidateQueries({ queryKey: ["block-status", conversation.otherUserId] });
      setConfirmAction(null);
    },
    onError: () => {
      message.error("Không thể bỏ chặn người dùng. Vui lòng thử lại.");
    },
  });

  // ---- Delete conversation mutation ----
  const deleteMutation = useMutation({
    mutationFn: () => deleteConversation(conversation.id),
    onSuccess: () => {
      message.success("Đã xóa đoạn chat");
      // Remove message cache for this conversation
      queryClient.removeQueries({ queryKey: messageKeys.list(conversation.id) });
      // Invalidate conversation list
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      setConfirmAction(null);
      onDeselectConversation();
    },
    onError: () => {
      message.error("Không thể xóa đoạn chat. Vui lòng thử lại.");
    },
  });

  // ---- Group Member Mutations ----
  const removeMemberMt = useMutation({
    mutationFn: (userId: string) => removeMember(conversation.id, userId),
    onSuccess: () => {
      message.success("Đã xóa thành viên khỏi nhóm");
      queryClient.invalidateQueries({ queryKey: ["group-members", conversation.id] });
      setMemberAction(null);
    },
  });

  // ---- Rename Group Mutation ----
  const renameGroupMt = useMutation({
    mutationFn: (name: string) => updateGroup(conversation.id, { name }),
    onSuccess: () => {
      message.success("Đã đổi tên nhóm");
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      setRenameGroupModalOpen(false);
    },
    onError: () => {
      message.error("Không thể đổi tên nhóm. Vui lòng thử lại.");
    },
  });

  const leaveMt = useMutation({
    mutationFn: () => leaveGroup(conversation.id),
    onSuccess: () => {
      message.success("Đã rời khỏi nhóm");
      queryClient.invalidateQueries({ queryKey: conversationKeys.all });
      setConfirmAction(null);
      onDeselectConversation();
    },
  });

  const handleConfirm = () => {
    if (confirmAction === "block") {
      blockMutation.mutate();
    } else if (confirmAction === "unblock") {
      unblockMutation.mutate();
    } else if (confirmAction === "delete") {
      deleteMutation.mutate();
    } else if (confirmAction === "leave") {
      leaveMt.mutate();
    }
  };

  const isConfirmLoading =
    blockMutation.isPending ||
    unblockMutation.isPending ||
    deleteMutation.isPending ||
    leaveMt.isPending;

  const handleMemberConfirm = () => {
    if (!memberAction) return;
    if (memberAction?.type === "remove" && memberAction.member) {
      removeMemberMt.mutate(memberAction.member.userId);
    }
  };

  const isMemberConfirmLoading = removeMemberMt.isPending;

  // ============================================================================
  // LEVEL-2: FILES DETAIL VIEWS
  // ============================================================================
  const renderMembers = () => (
    <div className="chat-info__detail">
      <Flex align="center" gap={12} className="chat-info__detail-header">
        <Flex
          align="center"
          justify="center"
          className="chat-info__back-btn"
          onClick={() => setCurrentView("main")}
        >
          <ArrowLeftIcon />
        </Flex>
        <span className="chat-info__detail-title">Thành viên nhóm</span>
      </Flex>
      <Flex
        vertical
        className="chat-info__members-list"
        style={{ marginTop: 12, overflowY: "auto", flex: 1 }}
      >
        {loadingMembers ? (
          <Text>Đang tải...</Text>
        ) : (
          membersList?.map((m: any) => (
            <Flex
              key={m.userId}
              align="center"
              gap={12}
              style={{
                padding: "12px 16px",
                borderRadius: 12,
                transition: "background 0.2s",
                cursor: "default",
              }}
              className="chat-info__member-item"
            >
              <Avatar
                src={getAvatarUrl(m.user?.profilePicture)}
                size={44}
                style={{ border: "1px solid rgba(0,0,0,0.05)" }}
              />
              <Flex vertical style={{ flex: 1, maxWidth: "calc(100% - 60px)" }}>
                <Flex align="center" gap={6}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      flexShrink: 1,
                    }}
                  >
                    {m.user?.displayName || "Người dùng Trendify"}
                  </span>
                  {m.role === "owner" && <CrownIcon />}
                </Flex>
                <span style={{ fontSize: 12, fontWeight: 400, opacity: 0.5 }}>
                  @{m.user?.username}
                </span>
              </Flex>

              {canManageRoles && m.userId !== currentUser?.id && m.role !== "owner" && (
                <Button 
                  type="text" 
                  shape="circle" 
                  icon={<LogOutIcon />} 
                  onClick={() => setMemberAction({ type: "remove", member: m })}
                  title="Đuổi khỏi nhóm"
                  style={{ color: "#ff4d4f" }}
                />
              )}
            </Flex>
          ))
        )}
      </Flex>
    </div>
  );


  const formatFileSize = (bytes: number) => {
    if (!bytes) return "";
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
  };

  const renderMedia = () => {
    const mediaItems = mediaData?.items ?? [];
    const isLoading = loadingMedia;

    return (
      <div className="chat-info__detail">
        <Flex align="center" gap={12} className="chat-info__detail-header">
          <Flex
            align="center"
            justify="center"
            className="chat-info__back-btn"
            onClick={() => setCurrentView("main")}
          >
            <ArrowLeftIcon />
          </Flex>
          <span className="chat-info__detail-title">File phương tiện</span>
        </Flex>

        {/* Tabs */}
        <Flex gap={0} className="chat-info__media-tabs">
          {(["image", "video", "file"] as TMediaTab[]).map((tab) => (
            <button
              key={tab}
              className={`chat-info__media-tab ${
                mediaTab === tab ? "chat-info__media-tab--active" : ""
              }`}
              onClick={() => setMediaTab(tab)}
            >
              {tab === "image" ? "Ảnh" : tab === "video" ? "Video" : "File"}
            </button>
          ))}
        </Flex>

        <div className="chat-info__media-body">
          {isLoading ? (
            <Flex justify="center" align="center" style={{ padding: "40px 0", opacity: 0.4 }}>
              <Text>Đang tải...</Text>
            </Flex>
          ) : mediaItems.length === 0 ? (
            <Flex vertical justify="center" align="center" gap={8} className="chat-info__media-empty">
              <span style={{ fontSize: 36, opacity: 0.2 }}>
                {mediaTab === "image" ? "🖼️" : mediaTab === "video" ? "🎬" : "📄"}
              </span>
              <Text style={{ opacity: 0.4, fontSize: 13 }}>
                Chưa có {mediaTab === "image" ? "ảnh" : mediaTab === "video" ? "video" : "file"} nào
              </Text>
            </Flex>
          ) : mediaTab === "image" ? (
            <Image.PreviewGroup>
              <div className="chat-info__detail-grid">
                {mediaItems.map((item: any) => (
                  <div key={item.id} className="chat-info__detail-thumb">
                    <Image
                      src={item.url}
                      alt={item.id}
                      preview={{ mask: false }}
                      rootClassName="chat-info__detail-img"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                        cursor: "pointer",
                      }}
                      fallback={item.thumbnailUrl || item.url}
                    />
                  </div>
                ))}
              </div>
            </Image.PreviewGroup>
          ) : mediaTab === "video" ? (
            <div className="chat-info__detail-grid">
              {mediaItems.map((item: any) => (
                <div key={item.id} className="chat-info__detail-thumb chat-info__detail-thumb--video">
                  {item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt={item.fileName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <video src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}
                  <div className="chat-info__detail-play">▶</div>
                </div>
              ))}
            </div>
          ) : (
            <Flex vertical gap={4} className="chat-info__detail-files">
              {mediaItems.map((item: any) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <Flex align="center" gap={12} className="chat-info__detail-file-row">
                    <Flex align="center" justify="center" className="chat-info__detail-file-icon">
                      <FileIcon />
                    </Flex>
                    <Flex vertical style={{ minWidth: 0, flex: 1 }}>
                      <span className="chat-info__detail-file-name">{item.fileName}</span>
                      <span className="chat-info__detail-file-meta">
                        {formatFileSize(item.size)}
                      </span>
                    </Flex>
                  </Flex>
                </a>
              ))}
            </Flex>
          )}
        </div>
      </div>
    );
  };

  // ============================================================================
  // MAIN VIEW
  // ============================================================================
  const renderMainView = () => (
    <div className="chat-info__scroll">
      {/* Shared Files — Preview Row */}
      <div className="chat-info__section">
        <Flex justify="space-between" align="center" className="chat-info__section-header">
          <span className="chat-info__section-title">File phương tiện</span>
          <Text
            className="chat-info__see-all"
            onClick={() => {
              setMediaTab("image");
              setCurrentView("media");
            }}
          >
            Xem tất cả
          </Text>
        </Flex>
      </div>

      {/* Tuỳ chỉnh đoạn chat */}
      <div className="chat-info__section">
        <Flex
          justify="space-between"
          align="center"
          className="chat-info__accordion-header"
          onClick={() => setCustomizeOpen((prev) => !prev)}
        >
          <span className="chat-info__section-title">Tuỳ chỉnh đoạn chat</span>
          {customizeOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Flex>

        <div
          className={`chat-info__accordion-body ${customizeOpen ? "chat-info__accordion-body--open" : ""}`}
        >
          <Flex
            gap={12}
            align="center"
            className="chat-info__customize-row"
            onClick={() => setThemeModalOpen(true)}
          >
            <Flex
              align="center"
              justify="center"
              className="chat-info__customize-icon chat-info__customize-icon--theme"
            >
              <PaletteIcon />
            </Flex>
            <span className="chat-info__customize-text">Đổi chủ đề</span>
          </Flex>

          <Flex
            gap={12}
            align="center"
            className="chat-info__customize-row"
            onClick={() => setEmojiModalOpen(true)}
          >
            <Flex
              align="center"
              justify="center"
              className="chat-info__customize-icon chat-info__customize-icon--emoji"
            >
              <EmojiIcon />
            </Flex>
            <span className="chat-info__customize-text">Thay đổi biểu tượng cảm xúc</span>
          </Flex>

          {/* Biệt danh: chỉ hiện với DM */}
          {conversation.type !== "group" && (
            <Flex
              gap={12}
              align="center"
              className="chat-info__customize-row"
              onClick={() => setNicknameModalOpen(true)}
            >
              <Flex
                align="center"
                justify="center"
                className="chat-info__customize-icon chat-info__customize-icon--nickname"
              >
                <EditIcon />
              </Flex>
              <span className="chat-info__customize-text">Chỉnh sửa biệt danh</span>
            </Flex>
          )}

          {/* Đổi tên nhóm: chỉ hiện với group owner */}
          {conversation.type === "group" && myRole === "owner" && (
            <Flex
              gap={12}
              align="center"
              className="chat-info__customize-row"
              onClick={() => {
                setRenameGroupValue(conversation.name || "");
                setRenameGroupModalOpen(true);
              }}
            >
              <Flex
                align="center"
                justify="center"
                className="chat-info__customize-icon chat-info__customize-icon--nickname"
              >
                <EditIcon />
              </Flex>
              <span className="chat-info__customize-text">Đổi tên nhóm</span>
            </Flex>
          )}
        </div>
      </div>

      {/* Tùy chọn Nhóm */}
      {conversation.type === "group" && (
        <div className="chat-info__section">
          <Flex
            justify="space-between"
            align="center"
            className="chat-info__accordion-header"
            onClick={() => setCurrentView("members")}
          >
            <Flex gap={12} align="center">
              <span className="chat-info__section-title">Thành viên trong nhóm</span>
            </Flex>
            <span
              style={{
                fontSize: 13,
                background: "rgba(0,0,0,0.05)",
                padding: "2px 8px",
                borderRadius: 10,
              }}
            >
              {conversation.memberCount}
            </span>
          </Flex>
        </div>
      )}

      {/* Quyền riêng tư & hỗ trợ */}
      <div className="chat-info__section">
        <Flex
          justify="space-between"
          align="center"
          className="chat-info__accordion-header"
          onClick={() => setPrivacyOpen((prev) => !prev)}
        >
          <span className="chat-info__section-title">Quyền riêng tư & hỗ trợ</span>
          {privacyOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Flex>

        <div
          className={`chat-info__accordion-body ${privacyOpen ? "chat-info__accordion-body--open" : ""}`}
        >
          <Flex
            gap={12}
            align="center"
            className="chat-info__customize-row chat-info__customize-row--danger"
            onClick={() => setConfirmAction(isBlockedByMe ? "unblock" : "block")}
          >
            <Flex
              align="center"
              justify="center"
              className="chat-info__customize-icon chat-info__customize-icon--danger"
            >
              <Icon name="BlockIcon" size={20} />
            </Flex>
            <span className="chat-info__customize-text">{isBlockedByMe ? "Bỏ chặn" : "Chặn"}</span>
          </Flex>

          <Flex
            gap={12}
            align="center"
            className="chat-info__customize-row chat-info__customize-row--danger"
            onClick={() => setConfirmAction("delete")}
          >
            <Flex
              align="center"
              justify="center"
              className="chat-info__customize-icon chat-info__customize-icon--danger"
            >
              <Icon name="TrashAltIcon" size={22} />
            </Flex>
            <span className="chat-info__customize-text">Xóa đoạn chat</span>
          </Flex>

          {conversation.type === "group" && (
            <Flex
              gap={12}
              align="center"
              className="chat-info__customize-row chat-info__customize-row--danger"
              onClick={() => setConfirmAction("leave")}
            >
              <Flex
                align="center"
                justify="center"
                className="chat-info__customize-icon chat-info__customize-icon--danger"
              >
                <ArrowLeftIcon />
              </Flex>
              <span className="chat-info__customize-text">Rời khỏi nhóm</span>
            </Flex>
          )}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // VIEW ROUTER
  // ============================================================================
  const renderContent = () => {
    switch (currentView) {
      case "media":
        return renderMedia();
      case "members":
        return renderMembers();
      default:
        return renderMainView();
    }
  };

  return (
    <div className="chat-info" id="chatInfo">
      {/* Content */}
      {renderContent()}

      {/* ===== MODAL: Đổi chủ đề ===== */}
      <Modal
        open={themeModalOpen}
        onCancel={() => setThemeModalOpen(false)}
        footer={null}
        title="Xem trước và chọn chủ đề"
        className="chat-info-modal"
        centered
        width={480}
      >
        <Flex vertical gap={4} className="chat-info-modal__theme-list">
          {THEME_OPTIONS.map((theme) => (
            <Flex
              key={theme.id}
              align="center"
              gap={12}
              className={`chat-info-modal__theme-item ${selectedTheme === theme.id ? "chat-info-modal__theme-item--active" : ""}`}
              onClick={() => {
                setSelectedTheme(theme.id);
                updateSettings.mutate(
                  { themeId: theme.id },
                  {
                    onSuccess: () => setThemeModalOpen(false),
                  },
                );
              }}
            >
              <div className="chat-info-modal__theme-dot" style={{ background: theme.color }} />
              <span className="chat-info-modal__theme-name">{theme.name}</span>
              {selectedTheme === theme.id && (
                <div className="chat-info-modal__theme-check">
                  <CheckIcon />
                </div>
              )}
            </Flex>
          ))}
        </Flex>
      </Modal>

      {/* ===== MODAL: Biểu tượng cảm xúc (emoji-picker-react) ===== */}
      <Modal
        open={emojiModalOpen}
        onCancel={() => setEmojiModalOpen(false)}
        footer={null}
        title="Biểu tượng cảm xúc"
        className="chat-info-modal chat-info-modal--emoji"
        centered
        width={420}
      >
        <Flex vertical gap={16}>
          {/* Current emoji */}
          <Flex justify="space-between" align="center" className="chat-info-modal__emoji-current">
            <Flex vertical gap={4}>
              <span className="chat-info-modal__emoji-label">Biểu tượng cảm xúc hiện tại</span>
              <span className="chat-info-modal__emoji-big">{selectedEmoji}</span>
            </Flex>
            <Flex
              align="center"
              gap={6}
              className="chat-info-modal__emoji-remove"
              onClick={handleRemoveEmoji}
            >
              <CloseIcon /> Gỡ
            </Flex>
          </Flex>

          {/* Emoji picker from library */}
          <div className="chat-info-modal__emoji-picker-wrapper">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              width="100%"
              height={320}
              searchPlaceHolder="Tìm kiếm biểu tượng cảm xúc"
              previewConfig={{ showPreview: false }}
              emojiStyle={EmojiStyle.NATIVE}
            />
          </div>
        </Flex>
      </Modal>

      {/* ===== MODAL: Biệt danh ===== */}
      <Modal
        open={nicknameModalOpen}
        onCancel={() => {
          setNicknameModalOpen(false);
          setEditingNickname(null);
        }}
        footer={null}
        title="Biệt danh"
        className="chat-info-modal"
        centered
        width={420}
      >
        <Flex vertical gap={4}>
          {/* Other person */}
          <Flex align="center" gap={12} className="chat-info-modal__nickname-row">
            <Avatar src={conversation.avatar} size={44} />
            {editingNickname === "other" ? (
              <Flex flex={1} gap={8} align="center">
                <Input
                  value={nicknameValue}
                  onChange={(e) => setNicknameValue(e.target.value)}
                  placeholder="Nhập biệt danh"
                  className="chat-info-modal__nickname-input"
                  autoFocus
                />
                <Flex
                  align="center"
                  justify="center"
                  className="chat-info-modal__nickname-action"
                  onClick={() => {
                    const targetId = conversation.otherUserId;
                    if (targetId) {
                      updateSettings.mutate(
                        { nicknames: { [targetId]: nicknameValue } },
                        {
                          onSuccess: () => setEditingNickname(null),
                        },
                      );
                    } else {
                      setEditingNickname(null);
                    }
                  }}
                >
                  <CheckIcon />
                </Flex>
              </Flex>
            ) : (
              <Flex flex={1} justify="space-between" align="center">
                <Flex vertical>
                  <span className="chat-info-modal__nickname-name">
                    {conversation.otherUserId && conversation.nicknames?.[conversation.otherUserId]
                      ? conversation.nicknames[conversation.otherUserId]
                      : conversation.name}
                  </span>
                  <span className="chat-info-modal__nickname-sub">Đặt biệt danh</span>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  className="chat-info-modal__nickname-action"
                  onClick={() => {
                    setEditingNickname("other");
                    setNicknameValue(conversation.name);
                  }}
                >
                  <PenIcon />
                </Flex>
              </Flex>
            )}
          </Flex>

          {/* Current user */}
          <Flex align="center" gap={12} className="chat-info-modal__nickname-row">
            <Avatar
              src={
                currentUser
                  ? getAvatarUrl(currentUser.profilePicture as any) ||
                    (typeof currentUser.profilePicture === "string"
                      ? currentUser.profilePicture
                      : DEFAULT_AVATAR_URL)
                  : DEFAULT_AVATAR_URL
              }
              size={44}
            />
            {editingNickname === "me" ? (
              <Flex flex={1} gap={8} align="center">
                <Input
                  value={nicknameValue}
                  onChange={(e) => setNicknameValue(e.target.value)}
                  placeholder="Nhập biệt danh"
                  className="chat-info-modal__nickname-input"
                  autoFocus
                />
                <Flex
                  align="center"
                  justify="center"
                  className="chat-info-modal__nickname-action"
                  onClick={() => {
                    if (currentUser?.id) {
                      updateSettings.mutate(
                        { nicknames: { [currentUser.id]: nicknameValue } },
                        {
                          onSuccess: () => setEditingNickname(null),
                        },
                      );
                    } else {
                      setEditingNickname(null);
                    }
                  }}
                >
                  <CheckIcon />
                </Flex>
              </Flex>
            ) : (
              <Flex flex={1} justify="space-between" align="center">
                <Flex vertical>
                  <span className="chat-info-modal__nickname-name">
                    {currentUser?.id && conversation.nicknames?.[currentUser.id]
                      ? conversation.nicknames[currentUser.id]
                      : "Bạn"}
                  </span>
                  <span className="chat-info-modal__nickname-sub">Đặt biệt danh</span>
                </Flex>
                <Flex
                  align="center"
                  justify="center"
                  className="chat-info-modal__nickname-action"
                  onClick={() => {
                    setEditingNickname("me");
                    setNicknameValue("");
                  }}
                >
                  <PenIcon />
                </Flex>
              </Flex>
            )}
          </Flex>
        </Flex>
      </Modal>

      {/* ===== MODAL: Đổi tên nhóm ===== */}
      <Modal
        open={renameGroupModalOpen}
        onCancel={() => setRenameGroupModalOpen(false)}
        title="Đổi tên nhóm"
        className="chat-info-modal"
        centered
        width={420}
        okText="Lưu"
        cancelText="Hủy"
        onOk={() => {
          const trimmed = renameGroupValue.trim();
          if (!trimmed) {
            message.warning("Tên nhóm không được để trống.");
            return;
          }
          renameGroupMt.mutate(trimmed);
        }}
        confirmLoading={renameGroupMt.isPending}
        okButtonProps={{ type: "primary" }}
      >
        <Input
          value={renameGroupValue}
          onChange={(e) => setRenameGroupValue(e.target.value)}
          placeholder="Nhập tên nhóm mới"
          maxLength={100}
          showCount
          autoFocus
          onPressEnter={() => {
            const trimmed = renameGroupValue.trim();
            if (trimmed) renameGroupMt.mutate(trimmed);
          }}
          style={{ marginTop: 8 }}
        />
      </Modal>

      {/* ===== MODAL: Xác nhận Chặn / Bỏ chặn / Xóa ===== */}
      <Modal
        open={confirmAction !== null}
        onCancel={() => !isConfirmLoading && setConfirmAction(null)}
        centered
        className="chat-info-modal chat-info-modal--confirm"
        width={400}
        okText={
          confirmAction === "block"
            ? "Chặn"
            : confirmAction === "unblock"
              ? "Bỏ chặn"
              : confirmAction === "leave"
                ? "Rời nhóm"
                : "Xóa"
        }
        cancelText="Hủy"
        onOk={handleConfirm}
        confirmLoading={isConfirmLoading}
        okButtonProps={{
          danger: confirmAction !== "unblock",
          type: "primary",
        }}
        cancelButtonProps={{
          disabled: isConfirmLoading,
        }}
      >
        <Flex vertical align="center" gap={12} className="chat-info-modal__confirm-body">
          <Flex align="center" justify="center" className="chat-info-modal__confirm-icon">
            {confirmAction === "delete" ? (
              <Icon name="TrashAltIcon" />
            ) : confirmAction === "leave" ? (
              <ArrowLeftIcon />
            ) : (
              <Icon name="BlockIcon" />
            )}
          </Flex>
          <span className="chat-info-modal__confirm-title">
            {confirmAction === "block"
              ? `Chặn ${conversation.name}?`
              : confirmAction === "unblock"
                ? `Bỏ chặn ${conversation.name}?`
                : confirmAction === "leave"
                  ? `Rời khỏi ${conversation.name}?`
                  : "Xóa đoạn chat?"}
          </span>
          <span className="chat-info-modal__confirm-desc">
            {confirmAction === "block"
              ? `${conversation.name} sẽ không thể gửi tin nhắn cho bạn, cũng không thể thấy thời điểm bạn hoạt động hoặc trạng thái đang hoạt động.`
              : confirmAction === "unblock"
                ? `${conversation.name} sẽ có thể gửi tin nhắn và xem trạng thái hoạt động của bạn.`
                : confirmAction === "leave"
                  ? "Bạn sẽ không nhận được tin nhắn từ nhóm này nữa và đoạn chat sẽ bị xóa khỏi danh sách."
                  : "Bạn sẽ không thể hoàn tác sau khi xóa đoạn chat này. Tất cả tin nhắn sẽ bị xóa vĩnh viễn."}
          </span>
        </Flex>
      </Modal>

      {/* ===== MODAL: Xác nhận Hành động Thành viên ===== */}
      <Modal
        open={memberAction !== null}
        onCancel={() => !isMemberConfirmLoading && setMemberAction(null)}
        centered
        className="chat-info-modal chat-info-modal--confirm"
        width={400}
        okText="Đuổi"
        cancelText="Hủy"
        onOk={handleMemberConfirm}
        confirmLoading={isMemberConfirmLoading}
        okButtonProps={{
          danger: true,
          type: "primary",
        }}
        cancelButtonProps={{
          disabled: isMemberConfirmLoading,
        }}
      >
        <Flex vertical align="center" gap={12} className="chat-info-modal__confirm-body">
          <Flex align="center" justify="center" className="chat-info-modal__confirm-icon">
            <Icon name="TrashAltIcon" />
          </Flex>
          <span className="chat-info-modal__confirm-title">
            {`Đuổi ${memberAction?.member?.user?.displayName} khỏi nhóm?`}
          </span>
          <span className="chat-info-modal__confirm-desc">
            "Người này sẽ không thể gửi hay nhận tin nhắn mới từ nhóm này nữa."
          </span>
        </Flex>
      </Modal>
    </div>
  );
};

export default ChatInfo;
