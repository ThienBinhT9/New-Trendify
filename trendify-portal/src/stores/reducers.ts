import { combineReducers } from "@reduxjs/toolkit";

import { loadingReducer } from "./loading";
import { authReducer } from "./auth";
import { profileReducer } from "./profile";
import { followReducer } from "./follow";
import { settingsReducer } from "./settings";
import { postReducer } from "./post";
import { notificationReducer } from "./notification";
import chatSlice from "./chat/slice";

const rootReducer = combineReducers({
  loading: loadingReducer,
  auth: authReducer,
  profile: profileReducer,
  follow: followReducer,
  settings: settingsReducer,
  posts: postReducer,
  notification: notificationReducer,
  chat: chatSlice.reducer,
});

export default rootReducer;
