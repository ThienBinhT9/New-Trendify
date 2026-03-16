import { Flex, Skeleton } from "antd";

import "./ProfileFriends.scss";

const FriendCardSkeleton = () => {
  return (
    <Flex className="friend-card">
      <Skeleton.Avatar active size={54} shape="circle" className="friend-card-avatar" />
      <Flex flex={1} vertical gap={6}>
        <Skeleton.Input active size="large" style={{ height: 14 }} />
        <Skeleton.Input active size="small" style={{ height: 14 }} />
      </Flex>
    </Flex>
  );
};

export default FriendCardSkeleton;
