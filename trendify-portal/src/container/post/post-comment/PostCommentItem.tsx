import { ReactNode, useMemo, useState } from "react";
import { App, Avatar, Flex, Skeleton } from "antd";

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
import { useAppDispatch } from "@/stores";
import { deleteCommentAction, getCommentRepliesAction } from "@/stores/post/actions";

type PostCommentItemProps = {
  isParent?: boolean;
  isChild?: boolean;
  comment: IComment;
  onDeleted?: (comment: IComment) => void;
};

const PostCommentItem = (props: PostCommentItemProps) => {
  const { isParent, isChild, comment, onDeleted } = props;

  const { message, modal, notification } = App.useApp();
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const [isOpenReply, setIsOpenReply] = useState<boolean>(false);
  const [commentsReply, setCommentsReply] = useState<IComment[]>([]);

  const [isLiked, setIsLiked] = useState<boolean>(comment.viewerContext.isLiked);
  const [likeCount, setLikeCount] = useState<number>(comment.counters.likeCount);
  const [likeLoading, setLikeLoading] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [replyNextCursor, setReplyNextCursor] = useState<string | null>(null);
  const [isLoadingReplies, setIsLoadingReplies] = useState<boolean>(false);
  const [isLoadingMoreReplies, setIsLoadingMoreReplies] = useState<boolean>(false);
  const [hasLoadedReplies, setHasLoadedReplies] = useState<boolean>(false);

  const commentContent = useMemo(() => {
    const ranges = [
      ...comment.mentions.map((mention) => ({
        userId: mention.userId,
        startIndex: mention.startIndex,
        endIndex: mention.endIndex,
        type: "mention" as const,
      })),
      ...comment.hashtags.map((hashtag) => ({
        tag: hashtag.tag,
        startIndex: hashtag.startIndex,
        endIndex: hashtag.endIndex,
        type: "hashtag" as const,
      })),
    ]
      .filter((range) => range.startIndex >= 0 && range.endIndex > range.startIndex)
      .sort((a, b) => a.startIndex - b.startIndex);

    if (!ranges.length) return [<span key="comment-text-all">{comment.content}</span>];

    const parts: ReactNode[] = [];
    let cursor = 0;

    ranges.forEach((range, index) => {
      if (range.startIndex < cursor) {
        return;
      }

      if (cursor < range.startIndex) {
        parts.push(
          <span key={`comment-text-${index}`}>
            {comment.content.slice(cursor, range.startIndex)}
          </span>,
        );
      }

      const highlightedText = comment.content.slice(range.startIndex, range.endIndex);

      if (range.type === "mention") {
        parts.push(
          <span
            key={`comment-mention-${index}`}
            className="post-content__mention"
            onClick={(event) => {
              event.stopPropagation();
              navigate(ROUTE_PATHS.PROFILE(range.userId));
            }}
          >
            {highlightedText}
          </span>,
        );
      }

      if (range.type === "hashtag") {
        parts.push(
          <span
            key={`comment-hashtag-${index}`}
            className="post-content__hashtag"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/hashtag/${range.tag}`);
            }}
          >
            {highlightedText}
          </span>,
        );
      }

      cursor = range.endIndex;
    });

    if (cursor < comment.content.length) {
      parts.push(<span key="comment-text-tail">{comment.content.slice(cursor)}</span>);
    }

    return parts;
  }, [comment.content, comment.hashtags, comment.mentions, navigate]);

  const authorName =
    comment.author.displayName ||
    `${comment.author.firstName || ""} ${comment.author.lastName || ""}`.trim() ||
    comment.author.username;

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

  const handleDelete = () => {
    if (isDeleting) return;

    modal.confirm({
      centered: true,
      icon: null,
      title: <Text textType="SB16">Xoá bình luận?</Text>,
      content: <Text>Bình luận sẽ bị xoá vĩnh viễn và không thể khôi phục.</Text>,
      okText: <Text textType="M14">Xoá</Text>,
      cancelText: <Text textType="M14">Huỷ</Text>,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          setIsDeleting(true);
          await dispatch(
            deleteCommentAction({
              postId: comment.postId,
              commentId: comment.id,
            }),
          ).unwrap();

          onDeleted?.(comment);

          notification.open({
            key: `delete-comment-toast-${comment.id}`,
            message: (
              <Flex align="center" justify="space-between" style={{ width: "100%" }}>
                <Text textType="SB16">Đã xoá bình luận</Text>
              </Flex>
            ),
            placement: "bottom",
            duration: 3,
            className: "custom-snackbar-notification",
            closeIcon: null,
          });
        } catch {
          message.error("Xoá bình luận thất bại, vui lòng thử lại.");
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  const naviagateToProfile = () => {
    navigate(ROUTE_PATHS.PROFILE(comment.author.id));
  };

  const handleFetchCommentsReplied = async (options?: {
    cursor?: string | null;
    append?: boolean;
  }) => {
    if (!comment.postId || !comment.id) return;

    try {
      const { cursor, append = false } = options || {};
      await new Promise((resolve) => setTimeout(() => resolve([]), 5000));
      const response = await dispatch(
        getCommentRepliesAction({
          postId: comment.postId,
          commentId: comment.id,
          params: {
            limit: 10,
            cursor,
          },
        }),
      ).unwrap();

      const fetchedReplies = response.replies || [];

      setCommentsReply((prevReplies) => {
        if (!append) return fetchedReplies;

        const existingIds = new Set(prevReplies.map((reply) => reply.id));
        const nextReplies = fetchedReplies.filter((reply) => !existingIds.has(reply.id));
        return [...prevReplies, ...nextReplies];
      });
      setReplyNextCursor(response.nextCursor || null);
      setHasLoadedReplies(true);
    } catch (error) {
      console.log("fetch list comment reply: ", error);
    } finally {
      setIsLoadingReplies(false);
      setIsLoadingMoreReplies(false);
    }
  };

  const handleOpenReply = () => {
    setIsOpenReply(true);
  };

  const handleViewReplies = async () => {
    if (isLoadingReplies || isLoadingMoreReplies) return;

    setIsOpenReply(true);

    if (!hasLoadedReplies) {
      setIsLoadingReplies(true);
      await handleFetchCommentsReplied();
      return;
    }

    if (!replyNextCursor) return;
    setIsLoadingMoreReplies(true);
    await handleFetchCommentsReplied({ cursor: replyNextCursor, append: true });
  };

  const shouldShowViewRepliesAction =
    comment.counters.replyCount > 0 &&
    !isLoadingReplies &&
    !isLoadingMoreReplies &&
    (!hasLoadedReplies || !!replyNextCursor);

  const handleReplySubmitted = (replyComment: IComment) => {
    setCommentsReply((prevReplies) => {
      if (prevReplies.some((item) => item.id === replyComment.id)) {
        return prevReplies;
      }

      return [...prevReplies, replyComment];
    });
    setIsOpenReply(true);
  };

  return (
    <Flex className="comment-item" gap={8}>
      {/* Line */}
      {isChild && <div className="comment-item-line-child" />}

      {/* Content */}
      <Avatar
        className={`comment-item-avatar ${isChild ? "comment-item-avatar--reply" : ""}`}
        src={comment.author.profilePicture?.small || comment.author.profilePicture?.original}
        onClick={naviagateToProfile}
      />
      <Flex vertical gap={4} className="content-item-body">
        <Flex vertical gap={4} style={{ position: "relative" }}>
          {(isParent || isOpenReply) && <div className="comment-item-line-parent" />}
          {comment.counters.replyCount > 0 && (
            <div className="comment-item-line-parent--view-replies" />
          )}

          <Flex vertical className="comment-item-content">
            <Text textType="SB12" className="comment-item-username" onClick={naviagateToProfile}>
              {authorName}
            </Text>
            <p className="post-content">{commentContent}</p>
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
              <Flex align="center" gap={8}>
                <Text
                  className="comment-item-actions__reply"
                  textType="R10"
                  onClick={handleOpenReply}
                >
                  Trả lời
                </Text>
                {comment.viewerContext.canDelete ? (
                  <Text
                    className="comment-item-actions__delete"
                    textType="R10"
                    onClick={handleDelete}
                  >
                    Xoá
                  </Text>
                ) : null}
              </Flex>
            </Flex>
          </Flex>

          {commentsReply?.length ? (
            <Flex vertical gap={12} className="mt-12">
              {commentsReply.map((commentReply) => (
                <PostCommentItem
                  key={commentReply.id}
                  comment={commentReply}
                  isChild
                  onDeleted={onDeleted}
                />
              ))}
            </Flex>
          ) : null}

          {isLoadingReplies || isLoadingMoreReplies ? (
            <Text textType="R12" className="comment-item-actions__reply-loading">
              Đang tải phản hồi...
            </Text>
          ) : null}

          {shouldShowViewRepliesAction && (
            <Flex
              align="center"
              gap={4}
              className="comment-item-actions__view-replies"
              onClick={handleViewReplies}
            >
              <div className="comment-item-line-child--view-replies" />
              <Text textType="M12">
                {!hasLoadedReplies
                  ? `Xem tất cả ${formatNumberCount(comment.counters.replyCount)} phản hồi`
                  : "Xem phản hồi khác"}
              </Text>
            </Flex>
          )}
        </Flex>

        {isOpenReply && (
          <Flex style={{ position: "relative", marginTop: 8 }}>
            <div className="comment-item-line-child" />
            <PostCommentInput
              postId={comment.postId}
              parentId={comment.id}
              replyDisplayName={authorName}
              onSubmitted={handleReplySubmitted}
            />
          </Flex>
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
