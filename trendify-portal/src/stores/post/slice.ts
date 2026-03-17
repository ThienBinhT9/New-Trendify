import { createSlice } from "@reduxjs/toolkit";
import * as actions from "./actions";
import { IPostState } from "./constants";

const initialState: IPostState = {
  userPosts: {},
  followingPosts: { posts: [], cursor: null, hasNext: false },
};

export const postSlice = createSlice({
  name: "post",
  initialState,
  reducers: {
    resetPostState: () => initialState,
  },

  extraReducers(builder) {
    builder

      // ================= CREATE POST =================
      .addCase(actions.createPostAction.fulfilled, (state, action) => {
        const post = action.payload;
        const userId = post.authorId;

        if (!state.userPosts[userId]) {
          state.userPosts[userId] = { posts: [], cursor: null, hasNext: false };
        }

        state.userPosts[userId].posts.unshift(post);
      })

      // ================= DELETE POST =================
      .addCase(actions.deletePostAction.fulfilled, (state, action) => {
        const postId = action.meta.arg;

        Object.keys(state.userPosts).forEach((userId) => {
          state.userPosts[userId].posts = state.userPosts[userId].posts.filter(
            (p) => p.id !== postId,
          );
        });

        state.followingPosts.posts = state.followingPosts.posts.filter((p) => p.id !== postId);
      })

      // ================= USER POSTS =================
      .addCase(actions.getUserPostsAction.fulfilled, (state, action) => {
        const { posts, nextCursor } = action.payload;
        const userId = action.meta.arg.userId; // Best practice: Get userId from arguments

        if (!userId) return;

        if (!state.userPosts[userId]) {
          state.userPosts[userId] = { posts: [], cursor: null, hasNext: false };
        }

        // If it's the first page (no cursor), replace posts. Else append.
        const isFirstPage = !action.meta.arg.params?.cursor;
        if (isFirstPage) {
          state.userPosts[userId].posts = posts;
        } else {
          state.userPosts[userId].posts = [...state.userPosts[userId].posts, ...posts];
        }

        state.userPosts[userId].cursor = nextCursor;
        state.userPosts[userId].hasNext = !!nextCursor;
      })

      // ================= FOLLOWING POSTS =================
      .addCase(actions.getFollowingPostsAction.fulfilled, (state, action) => {
        const { posts, nextCursor } = action.payload;

        state.followingPosts.posts = [...state.followingPosts.posts, ...posts];
        state.followingPosts.cursor = nextCursor;
        state.followingPosts.hasNext = !!nextCursor;
      });
  },
});

export const { resetPostState } = postSlice.actions;

export default postSlice;
