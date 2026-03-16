import { Flex, Tabs, TabsProps } from "antd";
import "./ProfileVideos.scss";
import Text from "@/components/text/Text";
import Button from "@/components/button/Button";
import { ImagePenIcon } from "@/assets/icons/Icon";
import ProfileVideoCard from "./ProfileVideoCard";

const ProfileVideos = () => {
  const tabs: TabsProps["items"] = [
    { key: "your-videos", label: "Your Videos" },
    { key: "tagged-videos", label: "Tagged Videos" },
    { key: "album", label: "Album" },
  ];

  return (
    <Flex>
      <Flex className="profile-videos-container">
        <Flex className="profile-videos-header">
          <Text textType="SB18">Videos</Text>
          <Flex align="center" gap={6}>
            <Button type="primary" icon={<ImagePenIcon style={{ width: 20, height: 20 }} />}>
              <Text textType="M14">Add video</Text>
            </Button>
          </Flex>
        </Flex>
        <Flex>
          <Tabs defaultActiveKey={"all-friends"} items={tabs} className="custom-tabs" />
        </Flex>
        <Flex wrap="wrap" gap={6}>
          <ProfileVideoCard />
          <ProfileVideoCard />
          <ProfileVideoCard />
          <ProfileVideoCard />
          <ProfileVideoCard />
          <ProfileVideoCard />
          <ProfileVideoCard />
          <ProfileVideoCard />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ProfileVideos;
