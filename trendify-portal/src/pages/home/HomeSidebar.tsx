import { Badge, Grid, MenuProps } from "antd";

import "./Home.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { useAppSelector } from "@/stores";

import Text from "@/components/text/Text";
import Icon from "@/components/icon/Icon";
import SidebarContainer from "../../layouts/components/sidebar/SidebarContainer";
import BottomNavContainer from "../../layouts/components/sidebar/BottomNavContainer";
import Avatar from "antd/es/avatar/Avatar";
import { getAvatarUrl } from "@/utils/common.util";

const SidebarHome = () => {
  const { user } = useAppSelector((state) => state.auth);
  const unreadCount = useAppSelector((state) => state.notification.unreadCount);
  const screens = Grid.useBreakpoint();
  const useBottomNav = !screens.sm;

  const renderActivityIcon = () => {
    return (
      <Badge dot={unreadCount > 0} className="notification-dot">
        <Icon name="HeartAltIcon" size={32} />
      </Badge>
    );
  };

  const sidebarMenuItems: Required<MenuProps>["items"][number][] = [
    {
      key: ROUTE_PATHS.HOME,
      icon: <Icon name="HomeDuotoneIcon" size={32} />,
      label: <Text textType="M14">Trang chủ</Text>,
    },
    {
      key: ROUTE_PATHS.ACTIVITY,
      icon: renderActivityIcon(),
      label: <Text textType="M14">Hoạt động</Text>,
    },
    {
      key: ROUTE_PATHS.SEARCH,
      icon: <Icon name="SearchDuoToneIcon" size={32} />,
      label: <Text textType="M14">Tìm kiếm</Text>,
    },
    {
      key: ROUTE_PATHS.MESSAGE,
      icon: <Icon name="MessengerIcon" size={30} />,
      label: <Text textType="M14">Tin nhắn</Text>,
    },
    {
      key: ROUTE_PATHS.PROFILE(user?.id),
      icon: <Avatar src={getAvatarUrl(user?.profilePicture)} />,
      label: <Text textType="M14">{`${user?.username}`}</Text>,
    },
  ].map((item) => ({ ...item, title: "" }));

  const bottomNavItems: Required<MenuProps>["items"][number][] = [
    {
      key: ROUTE_PATHS.HOME,
      icon: <Icon name="HomeDuotoneIcon" size={32} />,
      label: <Text textType="M14">Trang chủ</Text>,
    },
    {
      key: ROUTE_PATHS.SEARCH,
      icon: <Icon name="SearchDuoToneIcon" size={32} />,
      label: <Text textType="M14">Tìm kiếm</Text>,
    },
    {
      key: ROUTE_PATHS.ACTIVITY,
      icon: renderActivityIcon(),
      label: <Text textType="M14">Hoạt động</Text>,
    },
    {
      key: ROUTE_PATHS.MESSAGE,
      icon: <Icon name="MessengerIcon" size={30} />,
      label: <Text textType="M14">Tin nhắn</Text>,
    },
    {
      key: ROUTE_PATHS.PROFILE(user?.id),
      icon: <Icon name="UserCircleGrayIcon" size={30} />,
      label: <Text textType="M14">{`${user?.username}`}</Text>,
    },
  ].map((item) => ({ ...item, title: "" }));

  if (useBottomNav) {
    return <BottomNavContainer items={bottomNavItems} />;
  }

  return <SidebarContainer className="sidebar-home-container" items={sidebarMenuItems} />;
};

export default SidebarHome;
