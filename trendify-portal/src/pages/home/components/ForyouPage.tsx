import { Empty, Flex } from "antd";
import "../Home.scss";

import Post from "@/container/post/Post";
import { useCallback, useEffect, useRef, useState } from "react";
import { Virtuoso } from "react-virtuoso";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";

const LIMIT = 5;

const fakeGetPosts = async (cursor: number) => {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    data: [1, 1, 1, 1, 1],
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
      {[1, 1, 1].map((_, index) => (
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
              if (!isActive || !hasNext || isLoading) return;
              fetchPosts(cursor);
            }}
            itemContent={() => (
              <div className="foryou-item">
                <Post />
              </div>
            )}
            components={{
              Footer: () => (isLoading ? renderLoading() : null),
            }}
          />
        ) : (
          <Empty style={{ margin: "auto" }} />
        )}
      </Flex>
    </Flex>
  );
};

export default ForyouPage;

/* <Flex className="home-right">
        <Flex className="box-wrapper home-popular-hashtags">
          <Text textType="M14" className="text-second-color">
            POPULAR HASHTAGS
          </Text>
          <Flex className="popular-hashtags-list">
            {[1, 1, 1, 1, 1].map((_, index: number) => (
              <Flex gap={8} key={index} align="center">
                <Flex className="popular-hashtags-prefix">
                  <Text textType="R16" className="text-primary-color">
                    #
                  </Text>
                </Flex>
                <Flex vertical className="popular-hashtags-info">
                  <Text textType="M14" className="popular-hashtags-title" ellipsis={{ rows: 1 }}>
                    #hashtagfewfwgresgehgreh46h56h56hjthjtyjtyjtyjty
                  </Text>
                  <Text textType="R12" className="text-second-color">
                    1.2k posts
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Flex>
        <Flex className="box-wrapper home-articals">
          <Flex align="center" justify="space-between">
            <Text textType="M14" className="text-second-color">
              ARTICLES
            </Text>
            <Text className="artical-see-all">See All</Text>
          </Flex>
          <Flex className="artical-list">
            {[1, 1, 1, 1, 1].map((_, index: number) => (
              <Flex className="artical-item" key={index}>
                <Image
                  preview={{ mask: null }}
                  className="artical-thumb"
                  src="https://i.pinimg.com/736x/46/70/f7/4670f73a77815016dff6420da4d307f8.jpg"
                />
                <Flex className="artical-overview">
                  <Flex align="center" gap={8}>
                    <Avatar
                      className="artical-overview-avatar"
                      src={
                        "https://i.pinimg.com/736x/2b/8b/2e/2b8b2e70137fc91f3c69bf8ac8860981.jpg"
                      }
                    />
                    <Text textType="M12">ABC University </Text>
                  </Flex>
                  <Text textType="M14" ellipsis={{ rows: 1 }}>
                    Lorem ipsum dolor sit amet
                  </Text>
                  <Text textType="R12" ellipsis={{ rows: 2 }}>
                    Lorem ipsum dolor sit amet, consectetur adip labore et dolore magna aliqua. Ut
                    enim mini Lorem ipsum dolor sit amet, consectetur adip labore et dolore magna
                    aliqua. Ut enim mini Lorem ipsum dolor sit amet, consectetur adip labore et
                    dolore magna aliqua. Ut enim mini
                  </Text>
                </Flex>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Flex> */
