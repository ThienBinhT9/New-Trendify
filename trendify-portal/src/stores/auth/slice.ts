import { createSlice } from "@reduxjs/toolkit";

import * as actions from "./actions";
// import * as profileActions from "../profile/actions";
import { IAuthState } from "./constants";

const initialState: IAuthState = {
  user: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: (state) => {
      state.user = initialState.user;
      state.isAuthenticated = initialState.isAuthenticated;
    },
  },
  extraReducers(builder) {
    builder
      //sign up complete
      .addCase(actions.signupCompleteAction.fulfilled, (state, action) => {
        const user = action.payload.data.data.user;

        state.user = user ?? initialState.user;
        state.isAuthenticated = true;
      })
      .addCase(actions.signupCompleteAction.rejected, (state) => {
        state.user = initialState.user;
        state.isAuthenticated = false;
      })

      //sign in
      .addCase(actions.signinAction.fulfilled, (state, action) => {
        const user = action.payload.data.data.user;

        state.user = user ?? initialState.user;
        state.isAuthenticated = true;
      })
      .addCase(actions.signinAction.rejected, (state) => {
        state.user = initialState.user;
        state.isAuthenticated = false;
      })

      //sign out
      .addCase(actions.signoutAction.fulfilled, (state) => {
        state.user = initialState.user;
        state.isAuthenticated = false;
      })
      .addCase(actions.signoutAction.rejected, (state) => {
        state.user = initialState.user;
        state.isAuthenticated = false;
      });

    //update profile
    // .addCase(profileActions.updateProfileAction.fulfilled, (state, action) => {
    //   // state.user = action.payload;
    // });
  },
});

export const { reset } = authSlice.actions;

export default authSlice;
