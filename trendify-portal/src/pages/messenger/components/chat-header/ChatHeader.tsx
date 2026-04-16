import { Avatar, Flex, Typography } from "antd";

import type { IConversationLocal } from "../chat-sidebar/ChatSidebar";

import "./ChatHeader.scss";
import Icon from "@/components/icon/Icon";
import PresenceIndicator from "@/components/PresenceIndicator";
import { usePresence } from "@/hooks/usePresence";
import { formatLastSeen } from "@/components/PresenceIndicator";

const { Paragraph } = Typography;

interface ChatHeaderProps {
  conversation: IConversationLocal;
  showInfo: boolean;
  onToggleInfo: () => void;
}

const ChatHeader = ({ conversation, showInfo, onToggleInfo }: ChatHeaderProps) => {
  const isGroup = conversation.type === "group";
  const presence = usePresence(conversation.otherUserId);

  const statusText = isGroup
    ? `${conversation.memberCount ?? 0} thành viên`
    : presence.status === "online"
      ? "Đang hoạt động"
      : presence.status === "idle"
        ? "Không hoạt động"
        : formatLastSeen(presence.lastSeen);

  return (
    <Flex align="center" justify="space-between" className="chat-header" id="chatHeader">
      <Flex gap={12} align="center">
        <div style={{ position: "relative", display: "inline-flex" }}>
          <Avatar src={conversation.avatar} size={40} className="chat-header__avatar" />
          {!isGroup && conversation.otherUserId && (
            <PresenceIndicator
              userId={conversation.otherUserId}
              size="sm"
              className="chat-header__presence"
            />
          )}
        </div>
        <Flex vertical gap={2}>
          <Paragraph className="chat-header__name m-0">{conversation.name}</Paragraph>
          {statusText && (
            <span className="chat-header__status">{statusText}</span>
          )}
        </Flex>
      </Flex>

      <Flex gap={8} align="center">
        <Flex
          className={`chat-header__action chat-header__action--info ${showInfo ? "chat-header__action--active" : ""}`}
          align="center"
          justify="center"
          onClick={onToggleInfo}
          title="Thông tin"
        >
          <Icon name="MenuIcon" />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ChatHeader;
