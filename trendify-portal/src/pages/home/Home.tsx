import { Flex } from "antd";
import { useEffect, useLayoutEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import ROUTE_PATHS from "@/routes/path.route";
import ForyouPage from "./components/ForyouPage";
import Following from "./components/FollowingPage";
import { getHomeScrollPosition, writeHomeScrollTop } from "./homeScrollStore";

const Home = () => {
  const location = useLocation();
  const isFollowing = location.pathname.startsWith(ROUTE_PATHS.FOLLOWING);
  const [shouldPrefetch, setShouldPrefetch] = useState<boolean>(false);

  useLayoutEffect(() => {
    const key = isFollowing ? "following" : "forYou";
    writeHomeScrollTop(getHomeScrollPosition(key));
  }, [isFollowing]);

  useEffect(() => {
    const enablePrefetch = () => setShouldPrefetch(true);
    if (typeof window === "undefined") return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => enablePrefetch());
      return () => w.cancelIdleCallback?.(id);
    }
    const timeoutId = setTimeout(enablePrefetch, 600);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <Flex vertical style={{ width: "100%" }}>
      <div style={{ display: isFollowing ? "none" : "block" }}>
        <ForyouPage isActive={!isFollowing} prefetch={isFollowing && shouldPrefetch} />
      </div>
      <div style={{ display: isFollowing ? "block" : "none" }}>
        <Following isActive={isFollowing} prefetch={!isFollowing && shouldPrefetch} />
      </div>
    </Flex>
  );
};

export default Home;
