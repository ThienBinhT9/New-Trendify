import { Flex } from "antd";
import "../../Profile.scss";
import "./ProfilePosts.scss";
import { useCallback, useEffect, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import Post from "@/container/post/Post";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import QuickPost from "@/container/quick-post/QuickPost";
import { getUserPostsAction } from "@/stores/post/actions";
import { useAppDispatch, useAppSelector } from "@/stores";
import { EPostActions } from "@/stores/post/constants";
import EmptyState from "@/container/empty/EmptyState";
import Icon from "@/components/icon/Icon";

const ProfilePosts = () => {
  const loading = useAppSelector((state) => state.loading);
  const profile = useAppSelector((state) => state.profile.profile);
  const userPosts = useAppSelector((state) => state.posts.userPosts);
  const isOwnProfile = useAppSelector((state) => state.profile.isOwnProfile);

  const profileData = profile?.id ? userPosts[profile.id] : undefined;
  const posts = profileData?.posts ?? [];
  const cursor = profileData?.cursor ?? null;
  const hasNext = profileData?.hasNext ?? false;
  const isUserPostsLoading = !!loading[EPostActions.GET_USER_POSTS];

  const dispatch = useAppDispatch();
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  const fetchPosts = useCallback(
    async (nextCursor?: string | null) => {
      try {
        if (profile?.id) {
          await dispatch(
            getUserPostsAction({ userId: profile.id, params: { cursor: nextCursor } }),
          );
        }
      } catch (error) {
        console.error(error);
      }
    },
    [dispatch, profile?.id],
  );

  useEffect(() => {
    if (profileData || isUserPostsLoading) return;
    fetchPosts();
  }, [fetchPosts, profileData, isUserPostsLoading]);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const renderLoading = () => (
    <Flex vertical gap={32} className="mt-32 w-max">
      {[1, 1, 1].map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </Flex>
  );

  return (
    <Flex className="profile-section-container profile-posts-container">
      {isOwnProfile && <QuickPost />}
      {isUserPostsLoading && posts.length === 0 ? (
        renderLoading()
      ) : posts.length > 0 ? (
        <Virtuoso
          customScrollParent={scrollParent ?? undefined}
          data={posts}
          className="profile-post-list"
          style={{ height: "100%" }}
          overscan={320}
          computeItemKey={(_, post) => post.id}
          endReached={() => {
            if (!hasNext || !cursor || isUserPostsLoading) return;
            fetchPosts(cursor);
          }}
          itemContent={(_, post) => (
            <div className="profile-post-item">
              <Post post={post} />
            </div>
          )}
          components={{
            Footer: () => (
              <div>
                {isUserPostsLoading && posts.length ? renderLoading() : null}
                <div className="list-bottom-spacer" />
              </div>
            ),
          }}
        />
      ) : isOwnProfile ? (
        <EmptyState
          variant="green"
          icon={<Icon name="ImagePenIcon" size={28} />}
          title="Chưa có bài viết nào"
          description="Chia sẻ khoảnh khắc đầu tiên của bạn với mọi người"
          ctaLabel="Đăng bài ngay"
          onCtaClick={() => {}}
        />
      ) : null}
    </Flex>
  );
};

export default ProfilePosts;
