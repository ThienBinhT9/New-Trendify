import { Flex, Tabs, TabsProps } from "antd";
import "./ProfileImages.scss";
import Text from "@/components/text/Text";
import Button from "@/components/button/Button";
import { ImagePenIcon } from "@/assets/icons/Icon";
import ProfileImageCard from "./ProfileImageCard";
import ProfileVideos from "../profile-videos/ProfileVideos";

const ProfileImages = () => {
  const tabs: TabsProps["items"] = [
    { key: "your-photo", label: "Your Photos" },
    { key: "tagged-photo", label: "Tagged Photos" },
    { key: "album", label: "Album" },
  ];
  return (
    <Flex vertical gap={16}>
      <Flex className="profile-images-container">
        <Flex className="profile-images-header">
          <Text textType="SB18">Images</Text>
          <Flex align="center" gap={6}>
            <Button type="primary" icon={<ImagePenIcon style={{ width: 20, height: 20 }} />}>
              <Text textType="M14">Add image</Text>
            </Button>
          </Flex>
        </Flex>
        <Flex>
          <Tabs defaultActiveKey={"all-friends"} items={tabs} className="custom-tabs" />
        </Flex>
        <Flex wrap="wrap" gap={6}>
          <ProfileImageCard />
          <ProfileImageCard />
          <ProfileImageCard />
          <ProfileImageCard />
          <ProfileImageCard />
          <ProfileImageCard />
          <ProfileImageCard />
          <ProfileImageCard />
        </Flex>
      </Flex>
      <ProfileVideos />
    </Flex>
  );
};

export default ProfileImages;
