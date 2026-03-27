import HeaderContainer from "@/layouts/components/header/HeaderContainer";
import Text from "@/components/text/Text";
import ROUTE_PATHS from "@/routes/path.route";
import { useLocation, useNavigate } from "react-router-dom";

import "./Activity.scss";

import {
  ACTIVITY_TABS,
  getActivitySearchByTab,
  getActivityTabFromSearch,
  type ActivityTabKey,
} from "./activityTabs";
import { readActivityScrollTop, setActivityScrollPosition } from "./activityScrollStore";

const ActivityHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeTab = getActivityTabFromSearch(location.search);
  const tabs = ACTIVITY_TABS.map((tab) => ({
    key: tab.key,
    label: <Text textType="SB14">{tab.label}</Text>,
  }));

  const handleTabChange = (key: string) => {
    if (key !== "all" && key !== "following" && key !== "mentions") {
      return;
    }

    const nextTab = key as ActivityTabKey;

    if (nextTab === activeTab) {
      return;
    }

    setActivityScrollPosition(activeTab, readActivityScrollTop());

    navigate({
      pathname: ROUTE_PATHS.ACTIVITY,
      search: getActivitySearchByTab(nextTab),
    });
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
