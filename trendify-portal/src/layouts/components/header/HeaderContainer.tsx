import { Flex, Tabs, TabsProps } from "antd";

import "./HeaderContainer.scss";

interface HeaderContainerProps {
  className?: string;
  tabs: TabsProps["items"];
  activeKey?: string;
  onTabChange?: (key: string) => void;
}

const HeaderContainer = (props: HeaderContainerProps) => {
  const { className, tabs, activeKey, onTabChange } = props;
  return (
    <Flex className={`header-container ${className || ""}`}>
      <Tabs
        className="header-home-tabs"
        defaultActiveKey={tabs?.[0]?.key}
        activeKey={activeKey}
        centered
        items={tabs}
        onChange={onTabChange}
      />
    </Flex>
  );
};

export default HeaderContainer;
