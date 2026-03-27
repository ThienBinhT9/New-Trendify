import { useCallback, useEffect, useMemo, useState } from "react";
import { Divider, Empty, Flex, Skeleton } from "antd";
import { Virtuoso } from "react-virtuoso";

import "./modal.scss";
import { listPostLikes } from "@/stores/post/api";
import { IPostLikeUser } from "@/stores/post/constants";
import { IUserRelationship } from "@/stores/profile/constants";

import Text from "@/components/text/Text";
import Modal from "@/components/modal/Modal";
import FriendCard from "@/pages/profile/tabs/profile-friends/FriendCard";

const LIKE_LIMIT = 20;

interface Props {
  open: boolean;
  postId: string;
  onCancel: () => void;
}

const ModalLikePost = (props: Props) => {
  const { open, postId, onCancel } = props;

  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [usersLiked, setUsersLiked] = useState<IPostLikeUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);

  const mapLikeToRelationship = useCallback((likeUser: IPostLikeUser): IUserRelationship => {
    return {
      id: likeUser.id,
      username: likeUser.username,
      firstName: likeUser.firstName || "",
      lastName: likeUser.lastName,
      profilePicture: likeUser.profilePicture || undefined,
      viewerContext: likeUser.viewerContext,
    };
  }, []);

  const handleFetchUsersLiked = useCallback(
    async (cursor?: string | null) => {
      if (!postId) return;

      const isInitialRequest = !cursor;
      try {
        if (isInitialRequest) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await listPostLikes(postId, {
          cursor: cursor || undefined,
          limit: LIKE_LIMIT,
        });

        const { likes, nextCursor: next } = response.data.data;

        setUsersLiked((prev) => (isInitialRequest ? likes : [...prev, ...likes]));
        setNextCursor(next || null);
        setHasMore(Boolean(next));
      } catch (error) {
        console.log("fetch users liked error: ", error);
      } finally {
        if (isInitialRequest) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [postId],
  );

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || !nextCursor) return;
    void handleFetchUsersLiked(nextCursor);
  }, [loading, loadingMore, hasMore, nextCursor, handleFetchUsersLiked]);

  const users = useMemo(
    () => usersLiked.map((likeUser) => mapLikeToRelationship(likeUser)),
    [usersLiked, mapLikeToRelationship],
  );

  useEffect(() => {
    if (!open || !postId) return;
    setUsersLiked([]);
    setNextCursor(null);
    setHasMore(false);
    void handleFetchUsersLiked();
  }, [open, postId, handleFetchUsersLiked]);

  return (
    <Modal
      open={open}
      closable={true}
      onCancel={onCancel}
      className="modal-likes-post"
      footer={null}
    >
      <Flex gap={6} vertical className="p-16">
        <Text textType="M20">Likes</Text>
        {loading ? (
          <Flex vertical>
            <UserItemSkeleton />
            <UserItemSkeleton />
            <UserItemSkeleton />
            <UserItemSkeleton />
          </Flex>
        ) : (
          <Flex className="list-user-liked">
            {users.length ? (
              <Virtuoso
                style={{ height: "60vh" }}
                data={users}
                endReached={handleLoadMore}
                itemContent={(index, relationship) => (
                  <Flex vertical>
                    {index > 0 && (
                      <Divider style={{ margin: "12px 0", borderColor: "#e8e8e8ff" }} />
                    )}
                    <FriendCard relationship={relationship} className="item-user-liked" />
                  </Flex>
                )}
                components={{
                  Footer: () => (loadingMore ? <UserItemSkeleton /> : null),
                }}
              />
            ) : (
              <Empty description="Nobody has liked this post yet." />
            )}
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};

const UserItemSkeleton = () => {
  return (
    <Flex vertical>
      <Divider style={{ margin: "12px 0", borderColor: "#e8e8e8ff" }} />
      <Flex align="center" gap={12}>
        <Skeleton.Avatar active />
        <Skeleton.Input active style={{ height: 20 }} />
      </Flex>
    </Flex>
  );
};

export default ModalLikePost;
