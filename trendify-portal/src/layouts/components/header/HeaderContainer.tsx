import { Flex, Tabs, TabsProps } from "antd";

import "./HeaderContainer.scss";
import { LogoIcon } from "@/assets/images";
interface HeaderContainerProps {
  className?: string;
  tabs: TabsProps["items"];
  activeKey?: string;
  showTabs?: boolean;
  showLogo?: boolean;
  onTabChange?: (key: string) => void;
}

const HeaderContainer = (props: HeaderContainerProps) => {
  const { className, tabs, activeKey, onTabChange, showTabs = true, showLogo = true } = props;
  return (
    <Flex className={`header-container ${className || ""}`}>
      {showLogo && (
        <Flex className="header-logo-icon">
          <img src={LogoIcon} />
        </Flex>
      )}
      {showTabs && (
        <Tabs
          className="header-tabs"
          defaultActiveKey={tabs?.[0]?.key}
          activeKey={activeKey}
          items={tabs}
          onChange={onTabChange}
        />
      )}
    </Flex>
  );
};

export default HeaderContainer;
