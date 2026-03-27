import { Flex } from "antd";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import "./Activity.scss";

import ActivityNotificationList from "./components/ActivityNotificationList";
import {
  getActivityScrollPosition,
  readActivityScrollTop,
  setActivityScrollPosition,
  writeActivityScrollTop,
} from "./activityScrollStore";
import { ACTIVITY_TABS, getActivityTabFromSearch, type ActivityTabKey } from "./activityTabs";

const Activity = () => {
  const location = useLocation();
  const activeTab = useMemo(() => getActivityTabFromSearch(location.search), [location.search]);
  const [shouldPrefetch, setShouldPrefetch] = useState<boolean>(false);

  const previousTabRef = useRef<ActivityTabKey>(activeTab);

  useLayoutEffect(() => {
    const previousTab = previousTabRef.current;

    if (previousTab !== activeTab) {
      setActivityScrollPosition(previousTab, readActivityScrollTop());
    }

    writeActivityScrollTop(getActivityScrollPosition(activeTab));
    previousTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    return () => {
      setActivityScrollPosition(previousTabRef.current, readActivityScrollTop());
    };
  }, []);

  useEffect(() => {
    const enablePrefetch = () => setShouldPrefetch(true);

    if (typeof window === "undefined") {
      return;
    }

    const win = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (win.requestIdleCallback) {
      const idleId = win.requestIdleCallback(() => enablePrefetch());
      return () => win.cancelIdleCallback?.(idleId);
    }

    const timeoutId = window.setTimeout(enablePrefetch, 2500);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <Flex className="activity-page">
      <Flex vertical className="activity-page__content">
        {ACTIVITY_TABS.map((tab) => {
          const isActive = tab.key === activeTab;

          return (
            <div key={tab.key} style={{ display: isActive ? "block" : "none" }}>
              <ActivityNotificationList
                tabKey={tab.key}
                isActive={isActive}
                prefetch={!isActive && shouldPrefetch}
              />
            </div>
          );
        })}
      </Flex>
    </Flex>
  );
};

export default Activity;
