import { Flex, Skeleton } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Virtuoso } from "react-virtuoso";

import Text from "@/components/text/Text";
import FriendCard from "@/pages/profile/tabs/profile-friends/FriendCard";
import { useAppDispatch } from "@/stores";
import { searchUsersAction } from "@/stores/search/actions";
import { IUserRelationship, IUserViewContext } from "@/stores/profile/constants";

const LIMIT = 10;

const UserSkeleton = () => (
  <Flex vertical gap={8}>
    {Array.from({ length: 4 }).map((_, i) => (
      <Flex key={i} className="friend-card search-friend-card" gap={12} align="center">
        <Skeleton.Avatar active size={48} />
        <Flex vertical flex={1} gap={6}>
          <Skeleton.Input active style={{ width: 140, height: 14 }} />
          <Skeleton.Input active style={{ width: 100, height: 12 }} />
        </Flex>
      </Flex>
    ))}
  </Flex>
);

const SearchPeople = () => {
  const dispatch = useAppDispatch();
  const [searchParams] = useSearchParams();
  const submittedQ = searchParams.get("q") ?? "";

  const [users, setUsers] = useState<IUserRelationship[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrollParent, setScrollParent] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setScrollParent(document.getElementById("mainLayoutChildren"));
  }, []);

  const fetchUsers = useCallback(
    async (q: string, nextCursor?: string) => {
      setLoading(true);
      try {
        const data = await dispatch(
          searchUsersAction({ params: { q, cursor: nextCursor, limit: LIMIT } }),
        ).unwrap();
        setUsers((prev) => (nextCursor ? [...prev, ...data.users] : data.users));
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

  //note
  const onFollowStatusChange = useCallback(
    (userId: string, newViewContext: Partial<IUserViewContext>) => {
      setUsers((prev) =>
        prev.map((user) => {
          if (user.id === userId && user.viewerContext) {
            return {
              ...user,
              viewerContext: {
                ...user.viewerContext,
                ...newViewContext,
              },
            };
          }
          return user;
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (!submittedQ) return;
    setUsers([]);
    setCursor(undefined);
    fetchUsers(submittedQ);
  }, [submittedQ, fetchUsers]);

  if (loading && users.length === 0) return <UserSkeleton />;
  if (!loading && users.length === 0) {
    return (
      <Flex className="search-empty" align="center" justify="center">
        <Text textType="R14" className="text-second-color">
          Không tìm thấy người dùng nào
        </Text>
      </Flex>
    );
  }

  return (
    <Virtuoso
      customScrollParent={scrollParent ?? undefined}
      data={users}
      style={{ height: "100%" }}
      endReached={() => {
        if (!hasNext || loading) return;
        fetchUsers(submittedQ, cursor);
      }}
      itemContent={(_i, user) => (
        <FriendCard
          key={user.id}
          relationship={user}
          className="search-friend-card"
          onFollowChange={(newViewContext) => onFollowStatusChange(user.id, newViewContext)}
        />
      )}
      components={{
        Footer: () => (
          <>
            {loading && <UserSkeleton />}
            <div className="list-bottom-spacer" />
          </>
        ),
      }}
    />
  );
};

export default SearchPeople;
