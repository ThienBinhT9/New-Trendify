import { Avatar, Flex } from "antd";
import { useState } from "react";
import "./QuickPost.scss";
import Input from "@/components/input/Input";

import PostCreate from "../post/post-editor/PostCreate";
import { useAppSelector } from "@/stores";

const QuickPost = () => {
  const profile = useAppSelector((state) => state.profile.profile);

  const [openCreateModal, setOpenCreateModal] = useState<boolean>(false);

  const onOpenModal = () => {
    setOpenCreateModal(true);
  };

  const onCloseModal = () => {
    setOpenCreateModal(false);
  };

  return (
    <>
      <Flex vertical className="quick-post-container" onClick={onOpenModal}>
        <Flex className="quick-post-header">
          <Avatar className="quick-post-avatar" src={profile?.profilePicture?.small} />
          <Input className="quick-post-input" placeholder="Bạn đang nghĩ gì?" readOnly />
        </Flex>
      </Flex>

      <PostCreate opened={openCreateModal} onClose={onCloseModal} />
    </>
  );
};

export default QuickPost;
