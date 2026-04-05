import { Flex, Skeleton } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Text from "@/components/text/Text";
import { useAppDispatch } from "@/stores";
import { searchHashtagsAction } from "@/stores/search/actions";
import { IHashtagResult } from "@/stores/search/constants";
import ROUTE_PATHS from "@/routes/path.route";
import { setSearchInputValue } from "../../searchStore";
import { Virtuoso } from "react-virtuoso";

const LIMIT = 10;

const formatPostCount = (count: number): string => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
};

const HashtagCard = ({
  hashtag,
  onSelect,
}: {
  hashtag: IHashtagResult;
  onSelect: (tag: string) => void;
}) => (
  <Flex
    className="search-hashtag-card"
    align="center"
    gap={12}
    onClick={() => onSelect(`#${hashtag.tag}`)}
  >
    <Flex className="hashtag-icon-wrapper" align="center" justify="center">
      <Text textType="SB16">#</Text>
    </Flex>
    <Flex vertical flex={1} gap={2}>
      <Text textType="SB14">{`#${hashtag.tag}`}</Text>
      <Text textType="R12" className="text-second-color">
        {`${formatPostCount(hashtag.postCount)} bài viết`}
      </Text>
    </Flex>
  </Flex>
);

const HashtagSkeleton = () => (
  <Flex vertical>
    {Array.from({ length: 4 }).map((_, i) => (
      <Flex key={i} className="search-hashtag-card" gap={12} align="center">
        <Skeleton.Avatar active size={40} />
        <Flex vertical flex={1} gap={6}>
          <Skeleton.Input active style={{ width: 140, height: 14 }} />
          <Skeleton.Input active style={{ width: 80, height: 12 }} />
        </Flex>
      </Flex>
    ))}
  </Flex>
);

const SearchHashtags = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const submittedQ = searchParams.get("q") ?? "";

  const [hashtags, setHashtags] = useState<IHashtagResult[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const fetchHashtags = useCallback(
    async (q: string, nextCursor?: string) => {
      setLoading(true);
      try {
        const data = await dispatch(
          searchHashtagsAction({ params: { q, cursor: nextCursor, limit: LIMIT } }),
        ).unwrap();
        setHashtags((prev) => (nextCursor ? [...prev, ...data.hashtags] : data.hashtags));
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
    setHashtags([]);
    setCursor(undefined);
    fetchHashtags(submittedQ);
  }, [submittedQ, fetchHashtags]);

  const navigateToSearch = (q: string) => {
    setSearchInputValue(q);
    navigate(`${ROUTE_PATHS.SEARCH}?q=${encodeURIComponent(q)}`);
  };

  if (loading && hashtags.length === 0) return <HashtagSkeleton />;
  if (!loading && hashtags.length === 0) {
    return (
      <Flex className="search-empty" align="center" justify="center">
        <Text textType="R14" className="text-second-color">Không tìm thấy hashtag nào</Text>
      </Flex>
    );
  }

  return (
    <Virtuoso
      customScrollParent={scrollParent ?? undefined}
      data={hashtags}
      style={{ height: "100%" }}
      endReached={() => {
        if (!hasNext || loading) return;
        fetchHashtags(submittedQ, cursor);
      }}
      itemContent={(_i, ht) => (
        <HashtagCard key={ht.tag} hashtag={ht} onSelect={navigateToSearch} />
      )}
      components={{
        Footer: () => (
          <>
            {loading && (
              <Flex vertical>
                {Array.from({ length: 2 }).map((_, i) => (
                  <Flex key={i} className="search-hashtag-card" gap={12} align="center">
                    <Skeleton.Avatar active size={40} />
                    <Skeleton.Input active style={{ width: 140, height: 14 }} />
                  </Flex>
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

export default SearchHashtags;
