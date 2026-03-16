import { MenuProps } from "antd";

import "./Home.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { useAppSelector } from "@/stores";

import Text from "@/components/text/Text";
import Icon from "@/components/icon/Icon";
import SidebarContainer from "../../layouts/components/sidebar/SidebarContainer";

const SidebarHome = () => {
  const { user } = useAppSelector((state) => state.auth);

  const sidebarMenuItems: Required<MenuProps>["items"][number][] = [
    {
      key: ROUTE_PATHS.HOME,
      icon: <Icon name="HomeDuotoneIcon" size={32} />,
      label: <Text textType="M14">Trang chủ</Text>,
    },
    {
      key: ROUTE_PATHS.ACTIVITY,
      icon: <Icon name="HeartAltIcon" size={32} />,
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
      icon: <Icon name="UserCircleGrayIcon" size={30} />,
      label: <Text textType="M14">{`${user?.username}`}</Text>,
    },
  ].map((item) => ({ ...item, title: "" }));

  return <SidebarContainer className="sidebar-home-container" items={sidebarMenuItems} />;
};

export default SidebarHome;
