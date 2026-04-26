import { Flex } from "antd";
import { Virtuoso } from "react-virtuoso";
import { useCallback, useEffect, useRef, useState } from "react";

import "../Home.scss";

import Post from "@/container/post/Post";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import EmptyState from "@/container/empty/EmptyState";
import Icon from "@/components/icon/Icon";
import { useForYouFeed } from "@/hooks/useForYouFeed";

interface ForyouPageProps {
  isActive?: boolean;
  prefetch?: boolean;
}

const ForyouPage = ({ isActive = false, prefetch = false }: ForyouPageProps) => {
  const {
    posts,
    isLoading,
    hasNext,
    fetchPosts,
    loadMore,
  } = useForYouFeed(20);

  const hasFetchedRef = useRef<boolean>(false);

  useEffect(() => {
    if ((!isActive && !prefetch) || hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchPosts();
  }, [fetchPosts, isActive, prefetch]);

  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const handleEndReached = useCallback(() => {
    if (!isActive || !hasNext || isLoading) return;
    loadMore();
  }, [isActive, hasNext, isLoading, loadMore]);

  const renderLoading = () => (
    <Flex vertical gap={32} className="mt-32">
      {[1, 2, 3].map((_, index) => (
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
        ) : posts.length > 0 ? (
          <Virtuoso
            customScrollParent={scrollParent ?? undefined}
            data={posts}
            className="foryou-list"
            style={{ height: "100%" }}
            endReached={handleEndReached}
            itemContent={(_index, post) => (
              <div className="foryou-item">
                <Post post={post} key={post.id} />
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
        ) : (
          <EmptyState
            variant="blue"
            icon={<Icon name="EarthIcon" size={28} />}
            title="Chưa có nội dung gợi ý"
            description="Tương tác nhiều hơn để nhận được gợi ý phù hợp hơn"
            ctaLabel="Tải lại"
            onCtaClick={() => {
              hasFetchedRef.current = false;
              fetchPosts();
            }}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default ForyouPage;
