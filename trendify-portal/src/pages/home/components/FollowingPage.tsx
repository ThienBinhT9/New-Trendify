import { Flex } from "antd";
import "../Home.scss";

import Post from "@/container/post/Post";
import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import { useAppDispatch, useAppSelector } from "@/stores";
import { getFollowingPostsAction } from "@/stores/post/actions";
import { EPostActions } from "@/stores/post/constants";

interface FollowingProps {
  isActive?: boolean;
  prefetch?: boolean;
}

const Following = ({ isActive = true, prefetch = false }: FollowingProps) => {
  const loading = useAppSelector((state) => state.loading);
  const followingPosts = useAppSelector((state) => state.posts.followingPosts);

  const dispatch = useAppDispatch();

  const { posts, cursor, hasNext } = followingPosts;

  const hasFetchedRef = useRef<boolean>(false);

  const fetchPosts = useCallback(async (nextCursor?: string | null) => {
    try {
      console.log("vao following page");
      await dispatch(getFollowingPostsAction({ params: { cursor: nextCursor } })).unwrap();
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if ((!isActive && !prefetch) || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPosts();
  }, [fetchPosts, isActive, prefetch]);

  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const renderLoading = () => (
    <Flex vertical gap={32} className="mt-32">
      {[1, 1, 1].map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </Flex>
  );

  const isInitialLoading = loading[EPostActions.GET_FOLLOWING_POSTS] && posts.length === 0;

  return (
    <Flex className="following-container">
      <Flex className="following-content">
        {isInitialLoading ? (
          renderLoading()
        ) : posts.length ? (
          <Virtuoso
            customScrollParent={scrollParent ?? undefined}
            data={posts}
            className="following-list"
            style={{ height: "100%" }}
            endReached={() => {
              if (!isActive || !hasNext || loading[EPostActions.GET_FOLLOWING_POSTS]) return;
              fetchPosts(cursor);
            }}
            itemContent={() => (
              <div className="following-item">
                <Post />
              </div>
            )}
            components={{
              Footer: () => (loading[EPostActions.GET_FOLLOWING_POSTS] ? renderLoading() : null),
            }}
          />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default Following;
