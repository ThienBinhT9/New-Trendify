import { Flex } from "antd";

import "./modal.scss";

import Post from "@/container/post/Post";
import Modal from "@/components/modal/Modal";
import PostCommentInput from "../post/post-comment/PostCommentInput";
import PostCommentItem from "../post/post-comment/PostCommentItem";
import { IComment } from "@/interfaces/comment.interface";

interface Props {
  open: boolean;
  onCancel: () => void;
}

const comment: IComment = {
  id: "comment_001",
  postId: "69b13945dac98e511974f1a2",
  content:
    "Ôi trời ơi nhìn ảnh mà thèm đi quá @nguyenvana, hồi trước tao cũng đi Cát Bà với @minhduc rồi, đẹp thật sự luôn! 🌊 #CátBà",
  mentions: [
    {
      userId: "697ecce7e4ba55404989e3b2",
      username: "nguyenvana",
      startIndex: 37,
      endIndex: 48,
    },
    {
      userId: "697ecce7e4ba55404989e3b9",
      username: "minhduc",
      startIndex: 85,
      endIndex: 93,
    },
  ],
  hashtags: [{ tag: "cátbà", startIndex: 118, endIndex: 124 }],
  author: {
    id: "697ecce7e4ba55404989e3b5",
    username: "linhpham",
    profilePicture: "https://i.pravatar.cc/150?img=9",
    firstName: "Linh",
    lastName: "Phạm",
  },
  counters: {
    likeCount: 5453543,
    replyCount: 2,
  },
  isLiked: false,
  parentId: null,
  createdAt: "2026-03-11T10:15:00.000Z",
  updatedAt: "2026-03-11T10:15:00.000Z",
};

const ModalDetailPost = (props: Props) => {
  const { open, onCancel } = props;

  return (
    <Modal open={open} onCancel={onCancel} className="modal-detail-post" footer={null}>
      <Flex gap={6} vertical>
        <Flex vertical className="modal-detail-post__content">
          <Post expandedTitle />
          <Flex className="modal-detail-post__comments" vertical gap={12}>
            <PostCommentItem comment={comment} />
            <PostCommentItem comment={comment} />
            <PostCommentItem comment={comment} />
            <PostCommentItem comment={comment} />
          </Flex>
        </Flex>
        <div className="modal-detail-post__footer">
          <PostCommentInput />
        </div>
      </Flex>
    </Modal>
  );
};

export default ModalDetailPost;
