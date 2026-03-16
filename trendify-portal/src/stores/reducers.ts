import { combineReducers } from "@reduxjs/toolkit";

import { loadingReducer } from "./loading";
import { authReducer } from "./auth";
import { profileReducer } from "./profile";
import { followReducer } from "./follow";
import { settingsReducer } from "./settings";

const rootReducer = combineReducers({
  loading: loadingReducer,
  auth: authReducer,
  profile: profileReducer,
  follow: followReducer,
  settings: settingsReducer,
});

export default rootReducer;
