import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, Divider, Empty, Flex, Skeleton } from "antd";
import InfiniteScroll from "react-infinite-scroll-component";

import "./modal.scss";
import ROUTE_PATHS from "@/routes/path.route";

import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";
import Modal from "@/components/modal/Modal";
import Button from "@/components/button/Button";

const fakeData = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];

interface Props {
  open: boolean;
  onCancel: () => void;
}

const ModalLikePost = (props: Props) => {
  const { open, onCancel } = props;

  const [loading, setLoading] = useState<boolean>(true);
  const [usersLiked, setUsersLiked] = useState<number[]>([]);

  const handleFetchUsersLiked = async (params: { page: number; limit: number }) => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(() => resolve(params), 2000));
      setUsersLiked(fakeData);
    } catch (error) {
      console.log("fetch users liked error: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = { page: 1, limit: 20 };
    handleFetchUsersLiked(params);
  }, []);

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
        <Text textType="R16">1.2K</Text>
        {loading ? (
          <Flex vertical>
            <UserItemSkeleton />
            <UserItemSkeleton />
            <UserItemSkeleton />
            <UserItemSkeleton />
          </Flex>
        ) : (
          <Flex className="list-user-liked" id="scrollableLikedPost">
            <InfiniteScroll
              dataLength={0}
              hasMore={true}
              scrollableTarget="scrollableLikedPost"
              loader={<UserItemSkeleton />}
              next={async () => {}}
            >
              {usersLiked.length ? (
                usersLiked.map((_, index: number) => (
                  <UserItem key={index} isLast={index === usersLiked.length - 1} />
                ))
              ) : (
                <Empty description="Nobody has liked this post yet." />
              )}
            </InfiniteScroll>
          </Flex>
        )}
      </Flex>
    </Modal>
  );
};

const UserItem = ({ isLast = false }: { isLast: boolean }) => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [isFollowing, setIsFollowing] = useState<boolean>(true);

  const naviagateToProfile = () => {
    navigate(ROUTE_PATHS.PROFILE("fewfewfew"));
  };

  const handleFollow = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(() => resolve([]), 2000));
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.log("follow error: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnFollow = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(() => resolve([]), 2000));
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.log("follow error: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex vertical>
      <Flex gap={8} align="center" justify="space-between">
        <Flex gap={8} align="center">
          <Avatar
            onClick={naviagateToProfile}
            src="https://i.pinimg.com/1200x/90/70/ed/9070edc42387e02b2d69b8154acf4524.jpg"
          />
          <Text textType="M14" className="username-liked" onClick={naviagateToProfile}>
            Trần Thu Uyên
          </Text>
        </Flex>
        {isFollowing ? (
          <Button
            type="primary"
            loading={loading}
            icon={<Icon name="UserPlusIcon" />}
            onClick={handleFollow}
          >
            <Text textType="M14">Follow</Text>
          </Button>
        ) : (
          <Button loading={loading} icon={<Icon name="UserBlockIcon" />} onClick={handleUnFollow}>
            <Text textType="M14">Unfollow</Text>
          </Button>
        )}
      </Flex>
      {!isLast && <Divider style={{ margin: "12px 0", borderColor: "#e8e8e8ff" }} />}
    </Flex>
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
