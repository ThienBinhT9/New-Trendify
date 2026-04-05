import { Flex } from "antd";
import { useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";

import ROUTE_PATHS from "@/routes/path.route";
import ActivityAll from "./tabs/ActivityAll";
import ActivityUnread from "./tabs/ActivityUnread";
import { getActivityScrollPosition, writeActivityScrollTop } from "./activity.helper";

import "./Activity.scss";

const Activity = () => {
  const location = useLocation();
  const isUnread = location.pathname.startsWith(ROUTE_PATHS.ACTIVITY_UNREAD);

  useLayoutEffect(() => {
    const key = isUnread ? "unread" : "all";
    writeActivityScrollTop(getActivityScrollPosition(key));
  }, [isUnread]);

  return (
    <Flex className="activity-page">
      <Flex vertical className="activity-page__content">
        <div style={{ display: isUnread ? "none" : "block", height: "100%" }}>
          <ActivityAll isActive={!isUnread} />
        </div>
        <div style={{ display: isUnread ? "block" : "none", height: "100%" }}>
          <ActivityUnread isActive={isUnread} />
        </div>
      </Flex>
    </Flex>
  );
};

export default Activity;
