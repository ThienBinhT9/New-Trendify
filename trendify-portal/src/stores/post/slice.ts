import { createSlice } from "@reduxjs/toolkit";
import * as actions from "./actions";
import { IPostState } from "./constants";
import { EPostStatus, IPost } from "@/interfaces/post.interface";

const initialState: IPostState = {
  userPosts: {},
  followingPosts: { posts: [], cursor: null, hasNext: false },
  savedPosts: { posts: [], cursor: null, hasNext: false },
  draftPosts: { posts: [], cursor: null, hasNext: false },
};

const updatePostInCollections = (
  state: IPostState,
  postId: string,
  updater: (post: IPost) => void,
) => {
  state.followingPosts.posts.forEach((post) => {
    if (post.id === postId) updater(post);
  });

  state.savedPosts.posts.forEach((post) => {
    if (post.id === postId) updater(post);
  });

  state.draftPosts.posts.forEach((post) => {
    if (post.id === postId) updater(post);
  });

  Object.values(state.userPosts).forEach((userPostData) => {
    userPostData.posts.forEach((post) => {
      if (post.id === postId) updater(post);
    });
  });
};

const setPostLikeState = (post: IPost, isLiked: boolean) => {
  const previousLiked = post.viewerContext?.isLiked;
  if (previousLiked === isLiked) return;

  post.counters.likeCount = Math.max(0, post.counters.likeCount + (isLiked ? 1 : -1));

  if (post.viewerContext) {
    post.viewerContext.isLiked = isLiked;
  }
};

const setPostSaveState = (post: IPost, isSaved: boolean) => {
  const previousSaved = post.viewerContext?.isSaved;
  if (previousSaved === isSaved) return;

  post.counters.saveCount = Math.max(0, post.counters.saveCount + (isSaved ? 1 : -1));

  if (post.viewerContext) {
    post.viewerContext.isSaved = isSaved;
  }
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

        if (post.status === EPostStatus.DRAFT) {
          state.draftPosts.posts.unshift(post);
          return;
        }

        const userId = post.author.id;

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
        state.savedPosts.posts = state.savedPosts.posts.filter((p) => p.id !== postId);
        state.draftPosts.posts = state.draftPosts.posts.filter((p) => p.id !== postId);
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
      })

      // ================= SAVED POSTS =================
      .addCase(actions.getSavedPostsAction.fulfilled, (state, action) => {
        const { posts, nextCursor } = action.payload;
        const isFirstPage = !action.meta.arg.params?.cursor;

        if (isFirstPage) {
          state.savedPosts.posts = posts;
        } else {
          state.savedPosts.posts = [...state.savedPosts.posts, ...posts];
        }

        state.savedPosts.cursor = nextCursor;
        state.savedPosts.hasNext = !!nextCursor;
      })

      // ================= DRAFT POSTS =================
      .addCase(actions.getDraftPostsAction.fulfilled, (state, action) => {
        const { posts, nextCursor } = action.payload;
        const isFirstPage = !action.meta.arg.params?.cursor;

        if (isFirstPage) {
          state.draftPosts.posts = posts;
        } else {
          state.draftPosts.posts = [...state.draftPosts.posts, ...posts];
        }

        state.draftPosts.cursor = nextCursor;
        state.draftPosts.hasNext = !!nextCursor;
      })

      // ================= LIKE / UNLIKE POST =================
      .addCase(actions.likePostAction.fulfilled, (state, action) => {
        const postId = action.meta.arg;
        updatePostInCollections(state, postId, (post) => setPostLikeState(post, true));
      })
      .addCase(actions.unlikePostAction.fulfilled, (state, action) => {
        const postId = action.meta.arg;
        updatePostInCollections(state, postId, (post) => setPostLikeState(post, false));
      })

      // ================= SAVE / UNSAVE POST =================
      .addCase(actions.savePostAction.fulfilled, (state, action) => {
        const postId = action.meta.arg;
        const isSaved = action.payload?.isSaved ?? true;
        updatePostInCollections(state, postId, (post) => setPostSaveState(post, isSaved));
      })
      .addCase(actions.unsavePostAction.fulfilled, (state, action) => {
        const postId = action.meta.arg;
        const isSaved = action.payload?.isSaved ?? false;
        updatePostInCollections(state, postId, (post) => setPostSaveState(post, isSaved));

        if (!isSaved) {
          state.savedPosts.posts = state.savedPosts.posts.filter((post) => post.id !== postId);
        }
      });
  },
});

export const { resetPostState } = postSlice.actions;

export default postSlice;
