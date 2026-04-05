import HeaderContainer from "@/layouts/components/header/HeaderContainer";
import Text from "@/components/text/Text";
import { useLocation, useNavigate } from "react-router-dom";

import "./Activity.scss";

import { ACTIVITY_TABS, getActivityTabFromPathname } from "./activity.constants";

const ActivityHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = getActivityTabFromPathname(location.pathname);
  const tabs = ACTIVITY_TABS.map((tab) => ({
    key: tab.key,
    label: <Text textType="SB14">{tab.label}</Text>,
  }));

  const handleTabChange = (key: string) => {
    const tab = ACTIVITY_TABS.find((t) => t.key === key);
    if (!tab || tab.key === activeTab) return;
    navigate(tab.path);
  };

  return (
    <HeaderContainer
      className="header-activity-container"
      tabs={tabs}
      activeKey={activeTab}
      onTabChange={handleTabChange}
    />
  );
};

export default ActivityHeader;
