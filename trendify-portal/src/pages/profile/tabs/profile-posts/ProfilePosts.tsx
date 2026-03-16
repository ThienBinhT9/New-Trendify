import { Empty, Flex } from "antd";
import "../../Profile.scss";
import "./ProfilePosts.scss";
import { useCallback, useEffect, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import Post from "@/container/post/Post";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import QuickPost from "@/container/quick-post/QuickPost";

const LIMIT = 5;

const fakeGetPosts = async (cursor: number) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    data: [1, 1, 1, 1, 1],
    cursor: cursor + LIMIT,
    hasNext: true,
  };
};

const ProfilePosts = () => {
  const [posts, setPosts] = useState<number[]>([]);
  const [cursor, setCursor] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchPosts = useCallback(async (nextCursor: number) => {
    try {
      setIsLoading(true);
      const res = await fakeGetPosts(nextCursor);
      setPosts((prev) => (nextCursor === 0 ? res.data : [...prev, ...res.data]));
      setCursor(res.cursor);
      setHasNext(res.hasNext);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      console.log("vao day");
    }
  }, []);

  useEffect(() => {
    fetchPosts(0);
  }, [fetchPosts]);

  return (
    <Flex className="profile-section-container">
      <QuickPost />
      {isLoading && !hasNext ? (
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
            if (!hasNext) return;
            fetchPosts(cursor);
          }}
        >
          {posts.length ? (
            posts.map((_, index) => <Post key={index} />)
          ) : (
            <Empty style={{ margin: "auto" }} />
          )}
        </InfiniteScroll>
      )}
    </Flex>
  );
};

export default ProfilePosts;
