import { ReactNode } from "react";
import { ShieldIcon, UserCircleGrayIcon } from "@/assets/icons/Icon";
import ROUTE_PATHS, { SUB_PATH_SETTINGS } from "@/routes/path.route";
import ProfilePrivacyContent from "./sections/settings-privacy/components/ProfilePrivacyContent";
import HideCountsContent from "./sections/settings-privacy/components/HideCountsContent";
import BlockedContent from "./sections/settings-privacy/components/BlockedContent";

export interface ISettingsDetailItem {
  key: string;
  label: string;
  icon?: ReactNode;
  badge?: ReactNode;
  path?: string;
  content?: ReactNode;
}

export interface ISettingsSection {
  key: string;
  label: string;
  icon?: ReactNode;
  path: string;
  items?: ISettingsDetailItem[];
}

export const SETTINGS_CONFIG: ISettingsSection[] = [
  {
    key: SUB_PATH_SETTINGS.PRIVACY,
    label: "Quyền riêng tư",
    icon: <ShieldIcon width={22} height={22} />,
    path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.PRIVACY),
    items: [
      {
        key: SUB_PATH_SETTINGS.PROFILE_PRIVACY,
        label: "Trang cá nhân riêng tư",
        badge: "Công khai",
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.PROFILE_PRIVACY),
        content: <ProfilePrivacyContent />,
      },
      {
        key: SUB_PATH_SETTINGS.MENTIONS,
        label: "Gắn thẻ và nhắc đến",
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.MENTIONS),
      },
      {
        key: SUB_PATH_SETTINGS.ONLINE_STATUS,
        label: "Trạng thái online",
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.ONLINE_STATUS),
      },
      {
        key: SUB_PATH_SETTINGS.BLOCKED,
        label: "Trang cá nhân đã chặn",
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.BLOCKED),
        content: <BlockedContent />,
      },

      {
        key: SUB_PATH_SETTINGS.HIDE_COUNTS,
        label: "Ẩn số lượt thích và lượt chia sẻ",
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.HIDE_COUNTS),
        content: <HideCountsContent />,
      },
    ],
  },
  {
    key: SUB_PATH_SETTINGS.ACCOUNT,
    label: "Tài khoản",
    icon: <UserCircleGrayIcon width={22} height={22} />,
    path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.ACCOUNT),
    items: [],
  },
];
