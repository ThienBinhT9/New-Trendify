import { useCallback, useEffect } from "react";
import { Empty, Flex } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";

import "../../Profile.scss";
import "./ProfileDraftPosts.scss";

import Post from "@/container/post/Post";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import { useAppDispatch, useAppSelector } from "@/stores";
import { getDraftPostsAction } from "@/stores/post/actions";
import { EPostActions } from "@/stores/post/constants";

const ProfileDraftPosts = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.loading);
  const isOwnProfile = useAppSelector((state) => state.profile.isOwnProfile);
  const draftPosts = useAppSelector((state) => state.posts.draftPosts);

  const { posts, cursor, hasNext } = draftPosts;

  const fetchDraftPosts = useCallback(
    async (nextCursor?: string | null) => {
      try {
        await dispatch(getDraftPostsAction({ params: { cursor: nextCursor } })).unwrap();
      } catch (error) {
        console.log("fetch profile draft posts error: ", error);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!isOwnProfile) return;
    fetchDraftPosts();
  }, [fetchDraftPosts, isOwnProfile]);

  if (!isOwnProfile) {
    return (
      <Flex className="profile-section-container profile-draft-posts-container">
        <Flex className="box-wrapper profile-draft-posts-container__empty" justify="center">
          <Empty description="Không có dữ liệu" />
        </Flex>
      </Flex>
    );
  }

  const isInitialLoading = loading[EPostActions.GET_DRAFT_POSTS] && posts.length === 0;

  return (
    <Flex className="profile-section-container profile-draft-posts-container">
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
            if (!hasNext || !cursor || loading[EPostActions.GET_DRAFT_POSTS]) return;
            fetchDraftPosts(cursor);
          }}
        >
          {posts.length ? (
            posts.map((post) => <Post key={post.id} post={post} viewerContext={post.viewerContext} />)
          ) : (
            <Flex className="box-wrapper profile-draft-posts-container__empty" justify="center">
              <Empty description="Bạn chưa có bản nháp nào" />
            </Flex>
          )}
        </InfiniteScroll>
      )}
    </Flex>
  );
};

export default ProfileDraftPosts;
