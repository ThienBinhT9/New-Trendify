import { Dropdown, Flex, Image, MenuProps } from "antd";
import "./ProfileImages.scss";
import { PenIcon } from "@/assets/icons/Icon";

const ProfileImageCard = () => {
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <a target="_blank" rel="noopener noreferrer" href="https://www.antgroup.com">
          1st menu item
        </a>
      ),
    },
    {
      key: "2",
      label: (
        <a target="_blank" rel="noopener noreferrer" href="https://www.aliyun.com">
          2nd menu item (disabled)
        </a>
      ),
    },
    {
      key: "3",
      label: (
        <a target="_blank" rel="noopener noreferrer" href="https://www.luohanacademy.com">
          3rd menu item (disabled)
        </a>
      ),
    },
  ];
  return (
    <Flex className="profile-image-card">
      <Image
        className="image-card-preview"
        preview={{ mask: false }}
        src="https://i.pinimg.com/736x/ee/f3/b6/eef3b6240faf3684bb15086186d6f2e3.jpg"
      />
      <Dropdown menu={{ items }} arrow placement="bottomRight" trigger={["click"]}>
        <Flex className="image-card-options">
          <PenIcon style={{ width: 18, height: 18 }} />
        </Flex>
      </Dropdown>
    </Flex>
  );
};

export default ProfileImageCard;
