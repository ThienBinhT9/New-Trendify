import { Avatar, Flex } from "antd";
import { useState } from "react";
import "./QuickPost.scss";
import Input from "@/components/input/Input";

import PostCreate from "../post/post-editor/PostCreate";

const QuickPost = () => {
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
          <Avatar
            className="quick-post-avatar"
            src={"https://i.pinimg.com/1200x/0b/54/b6/0b54b68fe601f1d58888023c1d4711e8.jpg"}
          />
          <Input className="quick-post-input" placeholder="Bạn đang nghĩ gì?" readOnly />
        </Flex>
      </Flex>

      <PostCreate opened={openCreateModal} onClose={onCloseModal} />
    </>
  );
};

export default QuickPost;
