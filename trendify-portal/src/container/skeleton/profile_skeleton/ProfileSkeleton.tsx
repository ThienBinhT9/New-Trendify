import { Avatar, Divider, Flex, Skeleton } from "antd";
import "./ProfileSkeleton.scss";

const ProfileSkeleton = () => {
  return (
    <Flex className="profile-container">
      <Flex className="profile-header">
        {/* Cover */}
        <div className="profile-skeleton__cover" />

        <Flex vertical style={{ padding: "0 32px", width: "100%" }}>
          <Flex className="profile-skeleton__info">
            {/* Avatar */}
            <div className="profile-skeleton__avatar-wrapper">
              <Avatar size={140} />
            </div>

            {/* Info */}
            <Flex vertical gap={12} flex={1}>
              <Skeleton.Input active size="large" style={{ width: 220 }} />
              <Skeleton.Input active size="small" style={{ width: 160 }} />
              <Skeleton active paragraph={{ rows: 2 }} title={false} />
            </Flex>

            {/* Button */}
            <Skeleton.Button active size="large" style={{ width: 120 }} />
          </Flex>

          <Divider />

          {/* Tabs */}
          <Flex gap={24}>
            <Skeleton.Input active style={{ width: 80 }} />
            <Skeleton.Input active style={{ width: 80 }} />
            <Skeleton.Input active style={{ width: 80 }} />
            <Skeleton.Input active style={{ width: 80 }} />
            <Skeleton.Input active style={{ width: 80 }} />
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ProfileSkeleton;
