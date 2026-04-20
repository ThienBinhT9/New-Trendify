import { useMemo, useState } from "react";
import { Avatar, Dropdown, Flex, Input } from "antd";
import { Virtuoso } from "react-virtuoso";
import type { MenuProps } from "antd";

import "./ChatSidebar.scss";
import { SearchIcon } from "@/assets/icons/Icon";
import { IUser } from "@/interfaces/user.interface";
import { getAvatarUrl } from "@/utils/common.util";
import { getFormattedLastMessage } from "../../messenger.helper";
import { TMessageType } from "@/interfaces/message.interface";
import { conversationKeys, useConversations } from "../../hooks/useConversations";
import { useCreateDM } from "../../hooks/useCreateDM";
import { mapConversationsToLocal } from "../../hooks/useConversationMapper";
import { pinConversation } from "@/stores/chat/api";
import { searchUsers } from "@/stores/search/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useDebounce from "@/hooks/useDebounce";
import { useUnreadConversations } from "../../hooks/useUnreadTracker";
import Icon from "@/components/icon/Icon";

import Text from "@/components/text/Text";
import ConversationItem from "../conversation-item/ConversationItem";
import ConversationItemSkeleton from "../conversation-item/ConversationItemSkeleton";
import CreateGroupModal from "../create-group-modal/CreateGroupModal";


export interface IConversationLocal {
  id: string;
  type: "direct" | "group";
  name: string;
  avatar: string;
  lastMessage:
    | string
    | {
        content: string;
        type: TMessageType;
      };
  time: string;
  unread: number;
  isOnline: boolean;
  isPinned: boolean;
  updatedAt: number;
  otherUserId?: string;
  memberCount?: number;
  // Settings
  themeId?: string;
  quickEmoji?: string;
  nicknames?: Record<string, string>;
}

interface ChatSidebarProps {
  currentUser: IUser;
  activeConversationId: string;
  onSelectConversation: (id: string) => void;
}

const ChatSidebar = ({
  activeConversationId,
  onSelectConversation,
  currentUser,
}: ChatSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ["searchUsers", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm.trim()) return [];
      const res = await searchUsers({ q: debouncedSearchTerm });
      return res.data.data.users;
    },
    enabled: !!debouncedSearchTerm.trim(),
  });

  // ---- Create DM Hook ----
  const { mutate: createDM, isPending: isCreatingDM } = useCreateDM();

  // ---- Fetch conversations from API ----
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useConversations();

  // ---- Setup Query Client ----
  const queryClient = useQueryClient();

  // ---- Map API data → UI format ----
  const allConversations = useMemo(() => {
    if (!data?.pages) return [];

    const flatItems = data.pages.flatMap((page) => page.items);
    return mapConversationsToLocal(flatItems, currentUser.id);
  }, [data, currentUser.id]);

  // ---- Unread tracker ----
  const unreadConversations = useUnreadConversations();

  // ---- Pin Mutation ----
  const pinMutation = useMutation({
    mutationFn: (id: string) => pinConversation(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: conversationKeys.list() });
      const previousData = queryClient.getQueryData(conversationKeys.list());

      // Optimistic Update
      queryClient.setQueryData(conversationKeys.list(), (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            items: page.items.map((c: any) => {
              if (c.id === id) {
                const currentUserId = currentUser.id;
                const memberIndex = c.members?.findIndex((m: any) => m.userId === currentUserId);
                if (memberIndex > -1) {
                  return {
                    ...c,
                    members: c.members.map((m: any, index: number) =>
                      index === memberIndex ? { ...m, isPinned: !m.isPinned } : m,
                    ),
                  };
                }
                return { ...c, isPinned: !c.isPinned }; // Fallback
              }
              return c;
            }),
          })),
        };
      });

      return { previousData };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(conversationKeys.list(), context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
    },
  });

  const handlePin = (id: string) => {
    pinMutation.mutate(id);
  };
  // ---- Search + Sort ----
  const displayConversations = useMemo(() => {
    let filtered = allConversations.map((c) => ({
      ...c,
      isPinned: c.isPinned,
    }));

    // 1. Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((c) => {
        const nameMatch = c.name.toLowerCase().includes(term);
        const lastMsgText =
          typeof c.lastMessage === "string" ? c.lastMessage : c.lastMessage.content;
        const msgMatch = lastMsgText.toLowerCase().includes(term);
        return nameMatch || msgMatch;
      });
    }

    // 2. Sort: Pinned first, then by updatedAt desc
    return [...filtered].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [allConversations, searchTerm]);

  // ---- Load more (infinite scroll) ----
  const loadMore = () => {
    if (isFetchingNextPage || !hasNextPage) return;
    fetchNextPage();
  };

  const handleCreateDM = (userId: string) => {
    if (isCreatingDM) return;
    createDM(userId, {
      onSuccess: (newConversation) => {
        onSelectConversation(newConversation.id);
        setSearchTerm("");
      },
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const headerMenuItems: MenuProps["items"] = [
    {
      key: "create-group",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: "Tạo nhóm",
      onClick: () => setShowCreateGroup(true),
    },
  ];

  return (
    <Flex vertical className="chat-sidebar" id="chatSidebar">
      {/* Profile Header */}
      <Flex className="chat-sidebar__header" align="center" justify="space-between">
        <Flex gap={10} align="center">
          <Avatar
            src={getAvatarUrl(currentUser.profilePicture)}
            size={44}
            className="chat-sidebar__avatar"
          />
          <Flex vertical gap={2}>
            <Text textType="M16">{currentUser.firstName + " " + currentUser.lastName}</Text>
            <Text textType="R12">{currentUser.username}</Text>
          </Flex>
        </Flex>

        {/* Options dropdown */}
        <Dropdown
          menu={{ items: headerMenuItems }}
          trigger={["click"]}
          placement="bottomRight"
        >
          <Flex
            className="chat-sidebar__options-btn"
            align="center"
            justify="center"
          >
            <Icon name="MoreIcon" size={20} />
          </Flex>
        </Dropdown>
      </Flex>

      {/* Search */}
      <Flex className="chat-sidebar__search">
        <Input
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearchChange}
          prefix={<SearchIcon style={{ width: 16, height: 16, opacity: 0.4 }} />}
          className="chat-sidebar__search-input"
        />
      </Flex>

      {/* Conversation List / Search Results */}
      <div className="chat-sidebar__list" id="chatSidebarList" style={{ flex: 1 }}>
        {searchTerm.trim() ? (
          // Display Search Results
          <Flex vertical gap={4} style={{ padding: "0 8px" }}>
            <Text textType="M14" style={{ marginBottom: 8, opacity: 0.6 }}>
              Users
            </Text>
            {isSearching || searchTerm !== debouncedSearchTerm ? (
              Array.from({ length: 4 }).map((_, i) => <ConversationItemSkeleton key={i} />)
            ) : !searchData || searchData.length === 0 ? (
              <Text textType="R14" style={{ textAlign: "center", opacity: 0.6, marginTop: 20 }}>
                No users found
              </Text>
            ) : (
              searchData.map((user) => (
                <ConversationItem
                  key={user.id}
                  conversation={{
                    id: user.id,
                    avatar: getAvatarUrl(user.profilePicture),
                    isOnline: false,
                    isPinned: false,
                    // Use displayName (from backend toAuthorDTO) or fallback to username
                    name: user.displayName || user.username || "Unknown",
                    time: "",
                    unread: 0,
                    lastMessage: `@${user.username}`,
                    otherUserId: user.id,
                  }}
                  isActive={false}
                  isPinned={false}
                  onPin={() => {}}
                  onClick={() => handleCreateDM(user.id)}
                />
              ))
            )}
          </Flex>
        ) : // Display Regular Conversations
        isLoading ? (
          <Flex vertical gap={4}>
            {Array.from({ length: 8 }).map((_, i) => (
              <ConversationItemSkeleton key={i} />
            ))}
          </Flex>
        ) : (
          <Virtuoso
            style={{ height: "100%" }}
            data={displayConversations}
            endReached={loadMore}
            components={{
              Footer: () =>
                isFetchingNextPage ? (
                  <Flex vertical gap={4} style={{ padding: "8px 0" }}>
                    <ConversationItemSkeleton />
                    <ConversationItemSkeleton />
                  </Flex>
                ) : null,
            }}
            itemContent={(_index, conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={{
                  id: conversation.id,
                  avatar: conversation.avatar,
                  isOnline: conversation.isOnline,
                  isPinned: conversation.isPinned,
                  name: conversation.name,
                  time: conversation.time,
                  unread: unreadConversations.has(conversation.id) ? 1 : conversation.unread,
                  lastMessage: getFormattedLastMessage(conversation.lastMessage),
                  otherUserId: conversation.otherUserId,
                }}
                isActive={conversation.id === activeConversationId}
                isPinned={conversation.isPinned}
                onPin={() => handlePin(conversation.id)}
                onClick={() => onSelectConversation(conversation.id)}
              />
            )}
          />
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onSuccess={(conversationId) => {
          onSelectConversation(conversationId);
        }}
      />
    </Flex>
  );
};

export default ChatSidebar;
