import { Flex, Menu, MenuProps, Popover } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import "./SidebarContainer.scss";
import { LogoIcon } from "@/assets/images";
import ROUTE_PATHS from "@/routes/path.route";

import Icon from "@/components/icon/Icon";
import Button from "@/components/button/Button";
import SidebarMenu from "./SidebarMenu";

interface SidebarContainerProps {
  className?: string;
  items: Required<MenuProps>["items"][number][];
}

const SidebarContainer = (props: SidebarContainerProps) => {
  const { className, items } = props;

  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [popoverOpen, setPopoverOpen] = useState<boolean>(false);

  const handleToggleCollapse = () => {
    setCollapsed((prev) => !prev);
  };

  const getSelectedKey = (): string => {
    const matched = [...items]
      .sort((a, b) => String(b?.key).length - String(a?.key).length)
      .find((item) => {
        const key = String(item?.key);
        return key === "/" ? location.pathname === "/" : location.pathname.startsWith(key);
      });

    return String(matched?.key ?? location.pathname);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleItemClick = (item: any) => {
    if (item.key === ROUTE_PATHS.SETTINGS) {
      setPopoverOpen(false);
    }
  };

  return (
    <Flex
      className={`sidebar-container ${collapsed ? "sidebar-container--collapsed" : "sidebar-container--expanded"} ${className}`}
    >
      <Flex className="sidebar-logo">
        {collapsed ? <img src={LogoIcon} style={{ width: 30 }} /> : null}
      </Flex>
      <Menu
        selectedKeys={[getSelectedKey()]}
        mode="inline"
        items={items}
        className="sidebar-menu"
        inlineCollapsed={collapsed}
        onClick={(tab) => navigate(tab.key)}
      />
      <Flex vertical className="sidebar-footer">
        <Popover
          trigger="click"
          placement="topLeft"
          styles={{ body: { padding: 0 } }}
          content={<SidebarMenu onItemClick={handleItemClick} />}
          arrow={false}
          align={{ offset: [20, -10] }}
          open={popoverOpen}
          onOpenChange={setPopoverOpen}
        >
          <Button
            className={`sidebar-footer-menu ${popoverOpen ? "sidebar-footer-menu--active" : ""}`}
          >
            <Icon name="MenuIcon" size={30} />
          </Button>
        </Popover>
        <Button onClick={handleToggleCollapse} className="sidebar-collapsed-btn">
          <Icon name="ArrowIcon" size={30} className="sidebar-arrow-icon" />
        </Button>
      </Flex>
    </Flex>
  );
};

export default SidebarContainer;
