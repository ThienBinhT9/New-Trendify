import { useState } from "react";
import { Avatar, Flex, Skeleton } from "antd";

import "./PostComment.scss";
import "../Post.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { formatDate, formatNumberCount, formatTimeFromNow } from "@/utils/common.util";
import { useNavigate } from "react-router-dom";

import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";
import Tooltip from "@/components/tooltip/Tooltip";
import PostCommentInput from "./PostCommentInput";
import { IComment } from "@/interfaces/comment.interface";

type PostCommentItemProps = {
  isParent?: boolean;
  isChild?: boolean;
  comment: IComment;
};

const PostCommentItem = (props: PostCommentItemProps) => {
  const { isParent, isChild, comment } = props;

  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [isOpenReply, setIsOpenReply] = useState<boolean>(false);
  const [commentsReply, setCommentsReply] = useState<IComment[]>([]);

  const [isLiked, setIsLiked] = useState<boolean>(comment.isLiked);
  const [likeCount, setLikeCount] = useState<number>(comment.counters.likeCount);
  const [likeLoading, setLikeLoading] = useState<boolean>(false);

  console.log({ loading });

  const handleLike = async () => {
    if (likeLoading) return;

    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikeCount((prev) => (newIsLiked ? prev + 1 : prev - 1));

    try {
      setLikeLoading(true);
      await new Promise((resolve) => setTimeout(() => resolve([]), 500));
    } catch (error) {
      setIsLiked(!newIsLiked);
      setLikeCount((prev) => (newIsLiked ? prev - 1 : prev + 1));
      console.log("like comment error: ", error);
    } finally {
      setLikeLoading(false);
    }
  };

  const handleOpenReply = () => {
    setIsOpenReply(!isOpenReply);
    handleFetchCommentsReplied();
  };

  const naviagateToProfile = () => {
    navigate(ROUTE_PATHS.PROFILE(comment.author.id));
  };

  const handleFetchCommentsReplied = async () => {
    try {
      setLoading(true);

      await new Promise((resolve) => setTimeout(() => resolve([]), 2000));
      setCommentsReply([comment, comment, comment]);
    } catch (error) {
      console.log("fetch list comment reply: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex className="comment-item" gap={8}>
      {/* Line */}
      {isChild && <div className="comment-item-line-child" />}
      {(isParent || isOpenReply) && <div className="comment-item-line-parent" />}

      {/* Content */}
      <Avatar
        className="comment-item-avatar"
        src={comment.author.profilePicture}
        onClick={naviagateToProfile}
      />
      <Flex vertical gap={4}>
        <Flex vertical className="comment-item-content">
          <Text textType="SB12" className="comment-item-username" onClick={naviagateToProfile}>
            {`${comment.author.firstName} ${comment.author.lastName}`}
          </Text>
          <Text>{comment.content}</Text>
        </Flex>
        <Flex className="comment-item-actions">
          <Flex align="center" gap={12}>
            <Tooltip
              title={formatDate(
                new Date(comment.createdAt).toISOString(),
                "dddd, MMMM D, YYYY [at] HH:mm",
              )}
              placement="bottom"
            >
              <Text textType="R10" className="comment-item-actions__createdat">
                {formatTimeFromNow(comment.createdAt)}
              </Text>
            </Tooltip>
            <Flex
              align="center"
              gap={2}
              className="comment-item-actions__like"
              onClick={handleLike}
            >
              <Icon name={isLiked ? "HeartFillIcon" : "HeartAltIcon"} size={12} />
              <Text textType="R10">{`${formatNumberCount(likeCount)}`}</Text>
            </Flex>
            <Flex
              align="center"
              gap={2}
              className="comment-item-actions__reply"
              onClick={handleOpenReply}
            >
              <Text textType="R10">Trả lời</Text>
            </Flex>
          </Flex>
        </Flex>

        {commentsReply?.length ? (
          <Flex vertical gap={12} className="mt-16">
            {commentsReply.map((commentReply) => (
              <PostCommentItem key={commentReply.id} comment={commentReply} isChild />
            ))}
          </Flex>
        ) : null}

        {isOpenReply && (
          <Flex style={{ position: "relative", marginTop: 8 }}>
            <div className="comment-item-line-child" />
            <PostCommentInput />
          </Flex>
          // <PostCommentInput />
        )}
      </Flex>
    </Flex>
  );
};

export const CommentItemSkeleton = ({ widthPercent = "100%" }: { widthPercent?: string }) => {
  return (
    <Flex gap={8}>
      <Skeleton.Avatar active style={{ width: 34, height: 34, marginTop: 8 }} />
      <Flex vertical flex={1}>
        <Skeleton.Input active style={{ width: widthPercent, height: 80, borderRadius: 12 }} />
      </Flex>
    </Flex>
  );
};

export default PostCommentItem;
