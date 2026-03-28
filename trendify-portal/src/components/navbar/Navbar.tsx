import { Badge, Flex } from "antd";

import Icon from "@/components/icon/Icon";
import { useNotifications } from "@/hooks/useNotifications";
import { useSocket } from "@/hooks/useSocket";

const Navbar = () => {
  const { unreadCount } = useNotifications();
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
