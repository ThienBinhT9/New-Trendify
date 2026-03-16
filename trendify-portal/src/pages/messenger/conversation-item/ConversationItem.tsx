import {
  EllipsisIcon,
  NotificationIcon,
  PhoneIcon,
  TrashIcon,
  UserBlockIcon,
  UserCircle,
  VideoCameraIcon,
} from "@/assets/icons/Icon";
import moment from "moment";
import { Avatar, Badge, Dropdown, Flex, MenuProps, Typography } from "antd";

import "./ConversationItem.scss";

import Text from "@/components/text/Text";
import { useRef, useState } from "react";

const { Paragraph } = Typography;

const ConversationItem = () => {
  const moreRef = useRef<HTMLDivElement>(null);
  const [showMore, setShowMore] = useState<boolean>(false);

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: "Turn off notifications",
      icon: <NotificationIcon style={{ width: 20, height: 20 }} />,
    },
    {
      key: "2",
      label: "View profile",
      icon: <UserCircle style={{ width: 20, height: 20 }} />,
    },
    {
      key: "3",
      label: "Voice call",
      icon: <PhoneIcon style={{ width: 20, height: 20 }} />,
    },
    {
      key: "4",
      label: "Video call",
      icon: <VideoCameraIcon style={{ width: 20, height: 20 }} />,
    },
    {
      key: "5",
      label: "Block",
      icon: <UserBlockIcon style={{ width: 20, height: 20 }} />,
    },
    {
      type: "divider",
    },
    {
      key: "6",
      label: "Delete chat",
      icon: <TrashIcon style={{ width: 20, height: 20 }} />,
    },
  ];

  return (
    <Flex gap={8} className="conversation-item" ref={moreRef}>
      <Avatar
        style={{ width: 48, height: 48, flexShrink: 0 }}
        src={"https://i.pinimg.com/736x/5f/bd/69/5fbd69b34c5ac7119a6ce8143c06919b.jpg"}
      />
      <Flex vertical className="conversation-item-info">
        <Flex gap={12} align="center" justify="space-between">
          <Text textType="M14">Robert Doe</Text>
          <Flex align="center" gap={10}>
            <Badge dot={true} offset={[-2, 6]} />
            <Dropdown
              menu={{ items }}
              placement="bottomRight"
              trigger={["click"]}
              onOpenChange={(open) => setShowMore(open)}
            >
              <Flex className={`conversation-item-more ${showMore ? "show-more" : ""}`}>
                <EllipsisIcon />
              </Flex>
            </Dropdown>
          </Flex>
        </Flex>
        <Flex gap={8} align="center" justify="space-between">
          <Paragraph ellipsis={{ rows: 1 }} className="conversation-item-last-message">
            Lorem ipsum dolor sit amet, Lorem ipsum dolor sit amet, Lorem ipsum dolor sit amet,
            Lorem ipsum dolor sit amet, Lorem ipsum dolor sit amet, Lorem ipsum dolor sit amet,
            Lorem ipsum dolor sit amet,
          </Paragraph>

          <Text textType="R12" className="conversation-item-time">
            {moment().format("h:mm A")}
          </Text>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConversationItem;
