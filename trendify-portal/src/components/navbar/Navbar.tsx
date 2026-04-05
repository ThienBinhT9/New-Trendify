import { Badge, Flex } from "antd";

import Icon from "@/components/icon/Icon";
import { useSocket } from "@/hooks/useSocket";
import { useAppSelector } from "@/stores";

const Navbar = () => {
  const unreadCount = useAppSelector((state) => state.notification.unreadCount);
  const { status } = useSocket();

  return (
    <Flex align="center" gap={12}>
      <Badge count={unreadCount} overflowCount={99} size="small">
        <Icon name="HeartAltIcon" size={28} />
      </Badge>

      <span>{status === "connected" ? "Online" : "Offline"}</span>
    </Flex>
  );
};

export default Navbar;
