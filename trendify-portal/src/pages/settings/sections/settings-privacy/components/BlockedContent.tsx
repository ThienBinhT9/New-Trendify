import { Flex, Skeleton } from "antd";
import { useCallback, useEffect } from "react";

import { EProfileActions } from "@/stores/profile/constants";
import { useAppDispatch, useAppSelector } from "@/stores";
import { listBlockedAction } from "@/stores/profile/actions";

import BlockedCard from "../../../../../container/card/BlockedCard";
import InfiniteScroll from "react-infinite-scroll-component";
import Text from "@/components/text/Text";

const BlockedContent = () => {
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.loading[EProfileActions.LIST_BLOCKED]);
  const blockedData = useAppSelector((state) => state.follow.blocked);

  const { users, hasNext, cursor } = blockedData;

  const handleGetBlockedUsers = useCallback(
    async (nextCursor?: string) => {
      try {
        await dispatch(listBlockedAction({ cursor: nextCursor })).unwrap();
      } catch (error) {
        console.log(error);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    handleGetBlockedUsers();
  }, [handleGetBlockedUsers]);

  if (loading) {
    return (
      <Flex vertical className="settings-blocked">
        {[1, 2, 3].map((_, i) => (
          <BlockedCardSkeleton key={i} />
        ))}
      </Flex>
    );
  }

  return (
    <Flex vertical className="settings-blocked">
      <InfiniteScroll
        dataLength={users.length}
        hasMore={hasNext}
        scrollableTarget="settings-blocked"
        className="profile-friends-list"
        loader={
          <Flex gap={8} style={{ width: "100%", flexWrap: "wrap" }}>
            {[1, 1, 1].map((_, index) => (
              <BlockedCardSkeleton key={index} />
            ))}
          </Flex>
        }
        next={() => {
          if (!hasNext || !cursor) return;
          handleGetBlockedUsers(cursor);
        }}
      >
        {users.length ? (
          users.map((relationship) => (
            <BlockedCard key={relationship.id} relationship={relationship} />
          ))
        ) : (
          <Flex align="center" justify="center">
            <Text textType="R14" style={{ opacity: 0.4, marginTop: 24 }}>
              Bạn chưa chặn ai.
            </Text>
          </Flex>
        )}
      </InfiniteScroll>
    </Flex>
  );
};
export default BlockedContent;

const BlockedCardSkeleton = () => (
  <Flex className="blocked-card" align="center" gap={12}>
    <Skeleton.Avatar active size={44} shape="circle" />
    <Flex vertical flex={1} gap={6}>
      <Skeleton.Input active size="small" style={{ height: 13, width: 120 }} />
      <Skeleton.Input active size="small" style={{ height: 12, width: 80 }} />
    </Flex>
    <Skeleton.Button active size="default" style={{ width: 80, borderRadius: 20 }} />
  </Flex>
);
