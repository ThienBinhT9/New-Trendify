import { Divider, Flex } from "antd";
import { ReactNode, useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/stores";
import { signoutAction } from "@/stores/auth/actions";
import Button from "@/components/button/Button";
import Text from "@/components/text/Text";
import "./SidebarMenu.scss";
import { useNavigate } from "react-router-dom";
import ROUTE_PATHS from "@/routes/path.route";
import { EThemeMode } from "@/interfaces/common.interface";
import { useTheme } from "@/provider/ThemeProvider";
import Icon from "@/components/icon/Icon";

interface ISubPanel {
  title: string;
  groups?: IMenuItem[][];
  customContent?: ReactNode;
}

interface IMenuItem {
  key: string;
  label: string;
  danger?: boolean;
  onClick?: () => void;
  children?: ISubPanel;
}

interface ISidebarMenuProps {
  onItemClick?: (item: IMenuItem) => void;
}

const SidebarMenu = ({ onItemClick }: ISidebarMenuProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const subPanelRef = useRef<HTMLDivElement>(null);
  const mainPanelRef = useRef<HTMLDivElement>(null);

  const [activeSubKey, setActiveSubKey] = useState<string | null>(null);
  const [popupHeight, setPopupHeight] = useState<number | undefined>(undefined);

  const handleLogout = () => dispatch(signoutAction({ logoutAll: false }));

  useEffect(() => {
    const activeRef = activeSubKey ? subPanelRef : mainPanelRef;
    if (activeRef.current) {
      setPopupHeight(activeRef.current.scrollHeight);
    }
  }, [activeSubKey]);

  useEffect(() => {
    if (mainPanelRef.current) {
      setPopupHeight(mainPanelRef.current.scrollHeight);
    }
  }, []);

  const menuGroups: IMenuItem[][] = [
    [
      {
        key: "appearance",
        label: "Giao diện",
        children: { title: "Giao diện", customContent: <ThemeSwitcher /> },
      },
      {
        key: ROUTE_PATHS.SETTINGS,
        label: "Cài đặt",
        onClick: () => navigate(ROUTE_PATHS.SETTINGS),
      },
    ],
    [
      {
        key: "logout",
        label: `Đăng xuất`,
        danger: true,
        onClick: handleLogout,
      },
    ],
  ];

  const activeSubPanel = activeSubKey
    ? (menuGroups.flat().find((item) => item.key === activeSubKey)?.children ?? null)
    : null;

  const renderGroup = (group: IMenuItem[], onItemClick?: (item: IMenuItem) => void) =>
    group.map((item) => (
      <Button
        key={item.key}
        type="text"
        className={`sidebar-menu-item ${item.danger ? "sidebar-menu-item--danger" : ""}`}
        onClick={() => {
          if (item.children) {
            setActiveSubKey(item.key);
          } else {
            item.onClick?.();
            onItemClick?.(item);
          }
        }}
      >
        <Text textType="M14" style={{ color: "inherit" }}>
          {item.label}
        </Text>
        {item.children && <Icon name="ArrowIcon" className="sidebar-menu-chevron" />}
      </Button>
    ));

  return (
    <Flex vertical className="sidebar-menu-popup" style={{ height: popupHeight }}>
      <Flex
        className={`sidebar-menu-track ${activeSubKey ? "sidebar-menu-track--sub" : "sidebar-menu-track--main"}`}
      >
        <Flex vertical className="sidebar-menu-panel" ref={mainPanelRef}>
          {menuGroups.map((group, gi) => (
            <>
              {gi > 0 && <Divider key={`divider-${gi}`} className="sidebar-menu-divider" />}
              <Flex vertical className="sidebar-menu-group" key={gi}>
                {renderGroup(group, onItemClick)}
              </Flex>
            </>
          ))}
        </Flex>

        <Flex vertical className="sidebar-menu-panel" ref={subPanelRef}>
          {activeSubPanel && (
            <>
              <Flex align="center" className="sidebar-menu-panel-header">
                <Icon
                  name="ArrowIcon"
                  className="sidebar-menu-back-btn"
                  size={24}
                  onClick={() => setActiveSubKey(null)}
                />
                <Text textType="SB14" className="sidebar-menu-panel-title">
                  {activeSubPanel.title}
                </Text>
              </Flex>

              {activeSubPanel.customContent}

              {activeSubPanel.groups?.map((group, gi) => (
                <>
                  {gi > 0 && <Divider key={`sub-divider-${gi}`} className="sidebar-menu-divider" />}
                  <Flex vertical className="sidebar-menu-group" key={gi}>
                    {renderGroup(group, onItemClick)}
                  </Flex>
                </>
              ))}
            </>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
};
export default SidebarMenu;

const ThemeSwitcher = () => {
  const { themeMode, setThemeMode } = useTheme();

  return (
    <Flex vertical className="sidebar-menu-group">
      <Flex className="sidebar-theme-switcher" align="center">
        <Button
          type="text"
          className={`sidebar-theme-option ${themeMode === EThemeMode.LIGHT ? "sidebar-theme-option--active" : ""}`}
          title="Sáng"
          icon={<Icon name="SunIcon" size={22} />}
          onClick={() => setThemeMode(EThemeMode.LIGHT)}
        />
        <Button
          type="text"
          className={`sidebar-theme-option ${themeMode === EThemeMode.DARK ? "sidebar-theme-option--active" : ""}`}
          title="Tối"
          icon={<Icon name="MoonIcon" size={16} />}
          onClick={() => setThemeMode(EThemeMode.DARK)}
        />
        <Button
          type="text"
          className={`sidebar-theme-option ${themeMode === EThemeMode.AUTO ? "sidebar-theme-option--active" : ""}`}
          onClick={() => setThemeMode(EThemeMode.AUTO)}
        >
          <Text textType="M14" style={{ color: "inherit" }}>
            Tự động
          </Text>
        </Button>
      </Flex>
    </Flex>
  );
};
