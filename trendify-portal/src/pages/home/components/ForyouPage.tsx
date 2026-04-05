import { Flex } from "antd";
import { Virtuoso } from "react-virtuoso";
import { useCallback, useEffect, useRef, useState } from "react";

import "../Home.scss";

import Post from "@/container/post/Post";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";

const LIMIT = 5;

const fakeGetPosts = async (cursor: number) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    data: [],
    cursor: cursor + LIMIT,
    hasNext: true,
  };
};

interface ForyouPageProps {
  isActive?: boolean;
  prefetch?: boolean;
}

const ForyouPage = ({ isActive = false, prefetch = false }: ForyouPageProps) => {
  const [posts, setPosts] = useState<number[]>([]);
  const [cursor, setCursor] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hasFetchedRef = useRef<boolean>(false);

  console.log({ cursor, hasNext });

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
    }
  }, []);

  useEffect(() => {
    if ((!isActive && !prefetch) || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPosts(0);
  }, [fetchPosts, isActive, prefetch]);

  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const renderLoading = () => (
    <Flex vertical gap={32} className="mt-32">
      {[1, 1, 1, 1, 1, 1, 1, 1].map((_, index) => (
        <PostSkeleton key={index} />
      ))}
    </Flex>
  );

  const isInitialLoading = isLoading && posts.length === 0;

  return (
    <Flex className="home-container">
      <Flex className="home-content">
        {isInitialLoading ? (
          renderLoading()
        ) : posts.length ? (
          <Virtuoso
            customScrollParent={scrollParent ?? undefined}
            data={posts}
            className="foryou-list"
            style={{ height: "100%" }}
            endReached={() => {
              // if (!isActive || !hasNext || isLoading) return;
              // fetchPosts(cursor);
            }}
            itemContent={() => (
              <div className="foryou-item">
                <Post />
              </div>
            )}
            components={{
              Footer: () => (
                <div>
                  {isLoading ? renderLoading() : null}
                  <div className="list-bottom-spacer" />
                </div>
              ),
            }}
          />
        ) : null}
      </Flex>
    </Flex>
  );
};

export default ForyouPage;
