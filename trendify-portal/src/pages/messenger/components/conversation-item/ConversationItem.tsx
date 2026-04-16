import { Avatar, Dropdown, Flex, MenuProps, Typography } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { EllipsisIcon, UserCircle, TickIcon } from "@/assets/icons/Icon";

import "./ConversationItem.scss";
import Text from "@/components/text/Text";
import PresenceIndicator from "@/components/PresenceIndicator";

const { Paragraph } = Typography;

interface IConversationInfo {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
  isPinned: boolean;
  otherUserId?: string;
}

interface ConversationItemProps {
  conversation: IConversationInfo;
  isActive: boolean;
  isPinned?: boolean;
  onPin?: () => void;
  onClick: () => void;
}

const ConversationItem = ({
  conversation,
  isActive,
  isPinned,
  onPin,
  onClick,
}: ConversationItemProps) => {
  const [showMore, setShowMore] = useState(false);
  const navigate = useNavigate();

  const menuItems: MenuProps["items"] = [
    {
      key: "pin",
      label: isPinned ? "Bỏ ghim" : "Ghim",
      icon: <TickIcon style={{ width: 18, height: 18 }} />,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        onPin?.();
      },
    },
    ...(conversation.otherUserId
      ? [
          {
            key: "view_profile",
            label: "Xem thông tin",
            icon: <UserCircle style={{ width: 18, height: 18 }} />,
            onClick: (e: any) => {
              e.domEvent.stopPropagation();
              navigate(`/profile/${conversation.otherUserId}`);
            },
          },
        ]
      : []),
  ];

  return (
    <Flex
      gap={10}
      className={`conversation-item ${isActive ? "conversation-item--active" : ""} ${isPinned ? "conversation-item--pinned" : ""}`}
      onClick={onClick}
      align="center"
    >
      {/* Avatar with online indicator */}
      <div style={{ position: "relative", display: "inline-flex" }}>
        <Avatar src={conversation.avatar} size={44} className="conversation-item__avatar" />
        {conversation.otherUserId && (
          <PresenceIndicator
            userId={conversation.otherUserId}
            size="sm"
            className="conversation-item__presence"
          />
        )}
      </div>

      {/* Info */}
      <Flex vertical className="conversation-item__info" flex={1}>
        <Flex align="center" justify="space-between" gap={8}>
          <Flex align="center" gap={4} style={{ overflow: "hidden" }}>
            <Text
              ellipsis={{ rows: 1 }}
              textType="SB12"
              className={`conversation-item__name m-0 ${conversation.unread > 0 ? "conversation-item__name--unread" : ""}`}
            >
              {conversation.name}
            </Text>
            {isPinned && (
              <TickIcon style={{ width: 12, height: 12, opacity: 0.6, flexShrink: 0 }} />
            )}
          </Flex>

          <Flex align="center" gap={6} className="conversation-item__actions">
            <span className="conversation-item__time">{conversation.time}</span>

            <Dropdown
              menu={{ items: menuItems }}
              placement="bottomRight"
              trigger={["click"]}
              onOpenChange={(open) => setShowMore(open)}
            >
              <Flex
                className={`conversation-item__more ${showMore ? "conversation-item__more--visible" : ""}`}
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisIcon />
              </Flex>
            </Dropdown>
          </Flex>
        </Flex>

        <Flex align="center" justify="space-between" gap={8}>
          <Paragraph ellipsis={{ rows: 1 }} className="conversation-item__message m-0">
            {conversation.lastMessage}
          </Paragraph>

          {conversation.unread > 0 && (
            <span className="conversation-item__unread">{conversation.unread}</span>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConversationItem;
