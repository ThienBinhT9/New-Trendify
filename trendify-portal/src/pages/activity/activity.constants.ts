import ROUTE_PATHS from "@/routes/path.route";
import { ActivityTabKey } from "./activity.types";

export const ACTIVITY_DEFAULT_TAB: ActivityTabKey = "all";

export const ACTIVITY_TABS: Array<{ key: ActivityTabKey; label: string; path: string }> = [
  { key: "all", label: "Tất cả", path: ROUTE_PATHS.ACTIVITY },
  { key: "unread", label: "Chưa đọc", path: ROUTE_PATHS.ACTIVITY_UNREAD },
];

const PATH_TO_TAB: Record<string, ActivityTabKey> = {
  [ROUTE_PATHS.ACTIVITY]: "all",
  [ROUTE_PATHS.ACTIVITY_UNREAD]: "unread",
};

export const getActivityTabFromPathname = (pathname: string): ActivityTabKey => {
  return PATH_TO_TAB[pathname] ?? ACTIVITY_DEFAULT_TAB;
};

export const ACTION_TEXT: Record<string, string> = {
  post_like: "đã thích bài viết của bạn.",
  post_comment: "đã bình luận bài viết của bạn.",
  follow: "đã bắt đầu theo dõi bạn.",
  follow_request: "muốn theo dõi bạn.",
  post_mention: "đã nhắc đến bạn trong một bình luận.",
};

export const EMPTY_STATE_DESCRIPTION: Record<ActivityTabKey, string> = {
  all: "Hoạt động của bạn sẽ xuất hiện ở đây",
  unread: "Bạn đã đọc hết thông báo rồi",
};

export const EMPTY_STATE_TITLE: Record<ActivityTabKey, string> = {
  all: "Chưa có hoạt động",
  unread: "Thông báo chưa đọc",
};

export const FETCH_LIMIT = 15;
export const SCROLL_PARENT_ID = "mainLayoutChildren";
