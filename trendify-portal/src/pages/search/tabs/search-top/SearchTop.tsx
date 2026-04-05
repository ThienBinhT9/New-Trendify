import { Divider, Flex } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";

import Text from "@/components/text/Text";
import Post from "@/container/post/Post";
import PostSkeleton from "@/container/skeleton/post_skeleton/PostSkeleton";
import { useAppDispatch } from "@/stores";
import { searchPostsAction } from "@/stores/search/actions";
import { IPost } from "@/interfaces/post.interface";

const LIMIT = 10;

const SearchPosts = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const submittedQ = searchParams.get("q") ?? "";

  const [posts, setPosts] = useState<IPost[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const fetchPosts = useCallback(
    async (q: string, nextCursor?: string) => {
      setLoading(true);
      try {
        const data = await dispatch(
          searchPostsAction({ params: { q, cursor: nextCursor, limit: LIMIT } }),
        ).unwrap();
        setPosts((prev) => (nextCursor ? [...prev, ...data.posts] : data.posts));
        setCursor(data.nextCursor);
        setHasNext(!!data.nextCursor);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!submittedQ) return;
    setPosts([]);
    setCursor(undefined);
    fetchPosts(submittedQ);
  }, [submittedQ, fetchPosts]);

  if (loading && posts.length === 0) {
    return (
      <Flex vertical gap={12}>
        {Array.from({ length: 3 }).map((_, i) => (
          <PostSkeleton key={i} />
        ))}
      </Flex>
    );
  }

  if (!loading && posts.length === 0) {
    return (
      <Flex className="search-empty" align="center" justify="center">
        <Text textType="R14" className="text-second-color">
          Không tìm thấy bài viết nào
        </Text>
      </Flex>
    );
  }

  return (
    <Virtuoso
      customScrollParent={scrollParent ?? undefined}
      data={posts}
      style={{ height: "100%" }}
      endReached={() => {
        if (!hasNext || loading) return;
        fetchPosts(submittedQ, cursor);
      }}
      itemContent={(index, post) => (
        <Flex vertical>
          {index > 0 && <Divider style={{ margin: 0, borderColor: "var(--gray-200)" }} />}
          <Post key={`${post.id}-${index}`} post={post} className="search-post" />
        </Flex>
      )}
      components={{
        Footer: () => (
          <>
            {loading && (
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
  );
};

export default SearchPosts;
