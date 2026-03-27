export type ActivityTabKey = "all" | "following" | "mentions";

export const ACTIVITY_DEFAULT_TAB: ActivityTabKey = "all";
const ACTIVITY_TAB_QUERY_KEY = "tab";

export const ACTIVITY_TABS: Array<{ key: ActivityTabKey; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "following", label: "Lượt theo dõi" },
  { key: "mentions", label: "Lượt nhắc" },
];

export const getActivityTabFromSearch = (search: string): ActivityTabKey => {
  const query = new URLSearchParams(search);
  const tab = query.get(ACTIVITY_TAB_QUERY_KEY);

  if (tab === "following" || tab === "mentions" || tab === "all") {
    return tab;
  }

  return ACTIVITY_DEFAULT_TAB;
};

export const getActivitySearchByTab = (tab: ActivityTabKey): string => {
  if (tab === ACTIVITY_DEFAULT_TAB) {
    return "";
  }

  const query = new URLSearchParams();
  query.set(ACTIVITY_TAB_QUERY_KEY, tab);

  return `?${query.toString()}`;
};
