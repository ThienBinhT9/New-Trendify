import { Badge, Flex, Typography } from "antd";

import "./NotificationCard.scss";

import Text from "@/components/text/Text";

const { Paragraph } = Typography;

const NotificationCard = () => {
  return (
    <Flex vertical gap={4} className="notification-card-container">
      <Flex align="center" gap={24} justify="space-between" className="notification-card-header">
        <Paragraph className="notification-card-title" ellipsis={{ rows: 1 }}>
          Lorem ipsum dolor sit amet
        </Paragraph>

        <Badge dot={true} offset={[-3, 3]} />
      </Flex>
      <Paragraph className="notification-card-message" ellipsis={{ rows: 2 }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
        labore et dolore magna aliqua. labore et dolore magna aliqua. labore et dolore magna aliqua.
      </Paragraph>
      <Text textType="R12">13 Oct 2024 - 15:30</Text>
    </Flex>
  );
};

export default NotificationCard;
