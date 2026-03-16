import React from "react";

import { ILayout } from "@/interfaces/common.interface";
import ROUTE_PATHS, { SUB_PATH_SETTINGS } from "./path.route";

//layouts
import MainLayout from "@/layouts/main-layout/MainLayout";
import GuestLayout from "@/layouts/guest-layout/GuestLayout";

//pages
import SignIn from "@/pages/guest/SignIn";
import SignUp from "@/pages/guest/SignUp";
import ResetPassword from "@/pages/guest/ResetPassword";
import RequestEmailVerification from "@/pages/guest/RequestEmailVerification";

import Welcome from "@/pages/welcome/Welcome";

import HomeHeader from "@/pages/home/HomeHeader";
import HomeSidebar from "@/pages/home/HomeSidebar";

import Search from "@/pages/search/Search";

import Messenger from "@/pages/messenger/Messenger";

import Profile from "@/pages/profile/Profile";
import ProfilePosts from "@/pages/profile/tabs/profile-posts/ProfilePosts";
import ProfileVideos from "@/pages/profile/tabs/profile-videos/ProfileVideos";
import ProfileImages from "@/pages/profile/tabs/profile-images/ProfileImages";
import ProfileFriends from "@/pages/profile/tabs/profile-friends/ProfileFriends";
import ProfileIntroduce from "@/pages/profile/tabs/profile-introduce/ProfileIntroduce";
import VerifyEmailCallback from "@/pages/guest/VerifyEmailCallback";
import Notification from "@/pages/notification/Notification";

import Settings from "@/pages/settings/Settings";
import SettingsPrivacy from "@/pages/settings/sections/settings-privacy/SettingsPrivacy";
import SettingsAccount from "@/pages/settings/sections/settings-account/SettingsAccount";
import SettingsDetailPanel from "@/pages/settings/components/SettingDetailPanel";
import Activity from "@/pages/activity/Activity";
import Home from "@/pages/home/Home";

const EmptyRoute: React.FC = () => null;

export interface IRoute {
  path: string;
  layout?: (props: ILayout) => React.ReactNode;
  element: React.FC;
  children?: IRoute[];
  sidebar?: React.FC;
  header?: React.FC;
}

export const publicRoutes: IRoute[] = [
  {
    path: ROUTE_PATHS.SIGN_IN,
    layout: GuestLayout,
    element: SignIn,
  },
  {
    path: ROUTE_PATHS.SIGN_UP_COMPLETE,
    layout: GuestLayout,
    element: SignUp,
  },
  {
    path: ROUTE_PATHS.REQUEST_EMAIL_VERIFICATION,
    layout: GuestLayout,
    element: RequestEmailVerification,
  },
  {
    path: ROUTE_PATHS.RESET_PASSWORD,
    layout: GuestLayout,
    element: ResetPassword,
  },
  {
    path: ROUTE_PATHS.VERIFY_EMAIL_CALLBACK,
    element: VerifyEmailCallback,
  },
];

export const privateRoutes: IRoute[] = [
  {
    path: ROUTE_PATHS.WELCOME,
    element: Welcome,
  },
  {
    path: ROUTE_PATHS.HOME,
    layout: MainLayout,
    element: Home,
    sidebar: HomeSidebar,
    header: HomeHeader,
    children: [{ path: "following", element: EmptyRoute }],
  },
  {
    path: ROUTE_PATHS.ACTIVITY,
    layout: MainLayout,
    element: Activity,
    sidebar: HomeSidebar,
  },
  {
    path: ROUTE_PATHS.MESSAGE,
    layout: MainLayout,
    element: Messenger,
    sidebar: HomeSidebar,
  },
  {
    path: ROUTE_PATHS.SEARCH,
    layout: MainLayout,
    element: Search,
    sidebar: HomeSidebar,
  },
  {
    path: ROUTE_PATHS.NOTIFICATIONS,
    layout: MainLayout,
    element: Notification,
    sidebar: HomeSidebar,
  },
  {
    path: ROUTE_PATHS.SETTINGS,
    layout: MainLayout,
    sidebar: HomeSidebar,
    element: Settings,
    children: [
      { path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.PRIVACY), element: SettingsPrivacy },
      { path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.ACCOUNT), element: SettingsAccount },
      {
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.PROFILE_PRIVACY),
        element: SettingsDetailPanel,
      },
      {
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.MENTIONS),
        element: SettingsDetailPanel,
      },
      {
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.ONLINE_STATUS),
        element: SettingsDetailPanel,
      },
      {
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.BLOCKED),
        element: SettingsDetailPanel,
      },
      {
        path: ROUTE_PATHS.SETTINGS_SECTION(SUB_PATH_SETTINGS.HIDE_COUNTS),
        element: SettingsDetailPanel,
      },
    ],
  },
  {
    path: ROUTE_PATHS.PROFILE(),
    layout: MainLayout,
    sidebar: HomeSidebar,
    element: Profile,
    children: [
      { path: ROUTE_PATHS.PROFILE(), element: ProfilePosts },
      { path: ROUTE_PATHS.PROFILE_VIDEOS(), element: ProfileVideos },
      { path: ROUTE_PATHS.PROFILE_IMAGES(), element: ProfileImages },
      { path: ROUTE_PATHS.PROFILE_FRIENDS(), element: ProfileFriends },
      { path: ROUTE_PATHS.PROFILE_FOLLOWERS(), element: ProfileFriends },
      { path: ROUTE_PATHS.PROFILE_FOLLOWING(), element: ProfileFriends },
      { path: ROUTE_PATHS.PROFILE_INTRODUCE(), element: ProfileIntroduce },
      { path: ROUTE_PATHS.PROFILE_PERSONAL_DETAIL(), element: ProfileIntroduce },
    ],
  },
];
