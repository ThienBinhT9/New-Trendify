import { useCallback, useEffect } from "react";
import { Empty, Flex } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";

import "../../Profile.scss";
import "./ProfileSavedPosts.scss";

import Post from "@/container/post/Post";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import { useAppDispatch, useAppSelector } from "@/stores";
import { getSavedPostsAction } from "@/stores/post/actions";
import { EPostActions } from "@/stores/post/constants";

const ProfileSavedPosts = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.loading);
  const isOwnProfile = useAppSelector((state) => state.profile.isOwnProfile);
  const savedPosts = useAppSelector((state) => state.posts.savedPosts);

  const { posts, cursor, hasNext } = savedPosts;

  const fetchSavedPosts = useCallback(
    async (nextCursor?: string | null) => {
      try {
        await dispatch(getSavedPostsAction({ params: { cursor: nextCursor } })).unwrap();
      } catch (error) {
        console.log("fetch profile saved posts error: ", error);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!isOwnProfile) return;
    fetchSavedPosts();
  }, [fetchSavedPosts, isOwnProfile]);

  if (!isOwnProfile) {
    return (
      <Flex className="profile-section-container profile-saved-posts-container">
        <Flex className="box-wrapper profile-saved-posts-container__empty" justify="center">
          <Empty description="Không có dữ liệu" />
        </Flex>
      </Flex>
    );
  }

  const isInitialLoading = loading[EPostActions.GET_SAVED_POSTS] && posts.length === 0;

  return (
    <Flex className="profile-section-container profile-saved-posts-container">
      {isInitialLoading ? (
        <Flex vertical gap={32} className="mt-32 w-max">
          {[1, 1, 1].map((_, index) => (
            <PostSkeleton key={index} />
          ))}
        </Flex>
      ) : (
        <InfiniteScroll
          dataLength={posts.length}
          hasMore={hasNext}
          scrollableTarget="mainLayoutChildren"
          className="post-list"
          loader={
            <Flex vertical gap={32}>
              {[1, 1].map((_, index) => (
                <PostSkeleton key={index} />
              ))}
            </Flex>
          }
          next={() => {
            if (!hasNext || !cursor || loading[EPostActions.GET_SAVED_POSTS]) return;
            fetchSavedPosts(cursor);
          }}
        >
          {posts.length ? (
            posts.map((post) => <Post key={post.id} post={post} viewerContext={post.viewerContext} />)
          ) : (
            <Flex className="box-wrapper profile-saved-posts-container__empty" justify="center">
              <Empty description="Bạn chưa lưu bài viết nào" />
            </Flex>
          )}
        </InfiniteScroll>
      )}
    </Flex>
  );
};

export default ProfileSavedPosts;
