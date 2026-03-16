import { debounce } from "lodash";
import { Empty, Flex } from "antd";
import { useLocation, useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import "./ProfileFriends.scss";
import { CloseCircleIcon, SearchIcon } from "@/assets/icons/Icon";
import { getProfileTab } from "@/utils/common.util";
import { SUB_PATH_PROFILE } from "@/routes/path.route";
import { useAppDispatch, useAppSelector } from "@/stores";
import { EProfileActions } from "@/stores/profile/constants";
import { listFollowersAction, listFollowingAction } from "@/stores/profile/actions";

import Text from "@/components/text/Text";
import Input from "@/components/input/Input";
import FriendCard from "./FriendCard";
import InfiniteScroll from "react-infinite-scroll-component";
import FriendCardSkeleton from "./FriendCardSkeleton";
import { LoaderPuff } from "@/components/loader";

const TAB_LABEL: Record<string, string> = {
  followers: "Followers",
  following: "Following",
  friends: "Friends",
};

const ProfileFriends = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { id: userId } = useParams();

  const currentTab = getProfileTab(location.pathname);
  const isFollowingTab = currentTab === SUB_PATH_PROFILE.FOLLOWING;

  const loading = useAppSelector((state) => state.loading);
  const isLoading =
    loading[isFollowingTab ? EProfileActions.LIST_FOLLOWING : EProfileActions.LIST_FOLLOWERS];

  const followState = useAppSelector((state) =>
    isFollowingTab ? state.follow.following : state.follow.followers,
  );
  const { users, cursor, searchUsers, page, hasNext } = followState;

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedQuery, setDebouncedQuery] = useState<string>("");

  const debouncedSetQuery = useRef(
    debounce((value: string) => setDebouncedQuery(value), 600),
  ).current;
  const isSearching = useMemo(() => debouncedQuery.trim().length > 0, [debouncedQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSetQuery(e.target.value);
  };

  const handleGetListFriends = useCallback(
    async ({
      nextCursor,
      nextPage,
      query,
    }: {
      nextCursor?: string;
      nextPage?: number;
      query?: string;
    }) => {
      if (!userId) return;

      try {
        let action;

        switch (currentTab) {
          case SUB_PATH_PROFILE.FOLLOWING:
            action = listFollowingAction({ userId, cursor: nextCursor, page: nextPage, query });
            break;
          case SUB_PATH_PROFILE.FOLLOWERS:
          case SUB_PATH_PROFILE.FRIENDS:
            action = listFollowersAction({ userId, cursor: nextCursor, page: nextPage, query });
            break;
          default:
            return;
        }

        await dispatch(action).unwrap();
      } catch (error) {
        console.log(error);
      }
    },
    [currentTab, userId, dispatch],
  );

  useEffect(() => {
    handleGetListFriends({});
  }, [handleGetListFriends]);

  useEffect(() => {
    if (isSearching) {
      handleGetListFriends({ nextPage: 1, query: debouncedQuery.trim() });
    }
  }, [handleGetListFriends, debouncedQuery, isSearching]);

  useEffect(() => {
    return () => {
      debouncedSetQuery.cancel();
    };
  }, [debouncedSetQuery]);

  return (
    <Flex className="profile-section-container profile-friends-container">
      <Flex className="profile-friends-header">
        <Text textType="SB18">{TAB_LABEL[currentTab] || "Friends"}</Text>
        <Flex align="center" gap={6}>
          <Input
            value={searchQuery}
            placeholder="Search"
            className="search-input"
            prefix={<SearchIcon style={{ width: 18, height: 18 }} />}
            onChange={handleSearchChange}
            suffix={
              isLoading ? (
                <LoaderPuff />
              ) : searchQuery ? (
                <CloseCircleIcon
                  width={20}
                  height={20}
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedQuery("");
                  }}
                />
              ) : null
            }
          />
        </Flex>
      </Flex>
      {isLoading && !hasNext ? (
        <Flex gap={8} style={{ width: "100%", flexWrap: "wrap" }}>
          {[1, 1, 1].map((_, index) => (
            <FriendCardSkeleton key={index} />
          ))}
        </Flex>
      ) : (
        <InfiniteScroll
          dataLength={debouncedQuery.trim() ? searchUsers.length : users.length}
          hasMore={hasNext}
          scrollableTarget="mainLayoutChildren"
          className="profile-friends-list"
          loader={
            <Flex gap={8} style={{ width: "100%", flexWrap: "wrap" }}>
              {[1, 1, 1].map((_, index) => (
                <FriendCardSkeleton key={index} />
              ))}
            </Flex>
          }
          next={() => {
            if (!hasNext) return;
            if (debouncedQuery.trim()) {
              handleGetListFriends({
                nextPage: (page || 1) + 1,
                query: debouncedQuery.trim() || undefined,
              });
            } else {
              if (!cursor) return;
              handleGetListFriends({ nextCursor: cursor });
            }
          }}
        >
          {users.length || searchUsers.length ? (
            (debouncedQuery.trim() ? searchUsers : users).map((relationship) => (
              <FriendCard key={relationship.id} relationship={relationship} />
            ))
          ) : (
            <Empty style={{ margin: "auto" }} />
          )}
        </InfiniteScroll>
      )}
    </Flex>
  );
};

export default ProfileFriends;
