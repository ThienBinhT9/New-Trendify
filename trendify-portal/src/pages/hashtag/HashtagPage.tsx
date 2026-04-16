import { useEffect, useState } from "react";
import { Divider, Flex } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";

import "./HashtagPage.scss";

import Post from "@/container/post/Post";
import Text from "@/components/text/Text";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import EmptyState from "@/container/empty/EmptyState";
import ROUTE_PATHS from "@/routes/path.route";
import { useHashtagPosts } from "./hooks/useHashtagPosts";

const HashtagPage = () => {
  const { tag } = useParams<{ tag: string }>();
  const navigate = useNavigate();

  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useHashtagPosts(tag);

  const posts = data?.pages.flatMap((page) => page.posts) || [];
  const isInitialLoading = isLoading && posts.length === 0;

  return (
    <Flex className="hashtag-page">
      <Flex className="hashtag-page__content" vertical>
        {/* Header */}
        <Flex className="hashtag-page__hero box-wrapper" vertical align="center">
          <div className="hashtag-page__hero-icon">#</div>
          <Text textType="SB22" className="hashtag-page__hero-tag">
            {`#${tag ?? ""}`}
          </Text>
          <Text textType="R14" className="text-second-color">
            {isInitialLoading ? "Đang tải..." : `${posts.length}${hasNextPage ? "+" : ""} bài viết`}
          </Text>
        </Flex>

        {/* Loading skeleton */}
        {isInitialLoading ? (
          <Flex vertical gap={12}>
            {Array.from({ length: 4 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </Flex>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<span style={{ fontSize: 40 }}>#</span>}
            title="Chưa có bài viết nào"
            description={`Chưa có bài viết nào sử dụng hashtag #${tag}`}
            ctaLabel="Khám phá"
            onCtaClick={() => navigate(ROUTE_PATHS.HOME)}
            variant="blue"
          />
        ) : (
          <Virtuoso
            customScrollParent={scrollParent ?? undefined}
            data={posts}
            style={{ height: "100%" }}
            endReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            itemContent={(index, post) => (
              <Flex vertical>
                {index > 0 && <Divider style={{ margin: 0, borderColor: "var(--gray-200)" }} />}
                <Post key={`${post.id}-${index}`} post={post} />
              </Flex>
            )}
            components={{
              Footer: () => (
                <>
                  {isFetchingNextPage && (
                    <Flex vertical gap={12}>
                      {Array.from({ length: 2 }).map((_, i) => (
                        <PostSkeleton key={i} />
                      ))}
                    </Flex>
                  )}
                  <div className="list-bottom-spacer" />
                </>
              ),
            }}
          />
        )}
      </Flex>
    </Flex>
  );
};

export default HashtagPage;
