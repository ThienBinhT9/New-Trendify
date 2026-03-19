import { Flex } from "antd";
import "../../Profile.scss";
import "./ProfilePosts.scss";
import { useCallback, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Post from "@/container/post/Post";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import QuickPost from "@/container/quick-post/QuickPost";
import { getUserPostsAction } from "@/stores/post/actions";
import { useAppDispatch, useAppSelector } from "@/stores";
import { EPostActions } from "@/stores/post/constants";

const ProfilePosts = () => {
  const loading = useAppSelector((state) => state.loading);
  const profile = useAppSelector((state) => state.profile.profile);
  const userPosts = useAppSelector((state) => state.posts.userPosts);
  const isOwnProfile = useAppSelector((state) => state.profile.isOwnProfile);

  const profileData = profile?.id ? userPosts[profile.id] : undefined;
  const posts = profileData?.posts ?? [];
  const cursor = profileData?.cursor ?? null;
  const hasNext = profileData?.hasNext ?? false;

  const dispatch = useAppDispatch();

  const fetchPosts = useCallback(
    async (nextCursor?: string | null) => {
      try {
        console.log({ profile });

        if (profile?.id) {
          await dispatch(
            getUserPostsAction({ userId: profile.id, params: { cursor: nextCursor } }),
          );
        }
      } catch (error) {
        console.error(error);
      }
    },
    [profile?.id],
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return (
    <Flex className="profile-section-container profile-posts-container">
      {isOwnProfile && <QuickPost />}
      {loading[EPostActions.GET_USER_POSTS] && !cursor ? (
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
              {[1, 1, 1].map((_, index) => (
                <PostSkeleton key={index} />
              ))}
            </Flex>
          }
          next={() => {
            if (!hasNext || !cursor) return;
            fetchPosts(cursor);
          }}
        >
          {posts.length ? posts.map((post) => <Post key={post.id} post={post} />) : null}
        </InfiniteScroll>
      )}
    </Flex>
  );
};

export default ProfilePosts;
