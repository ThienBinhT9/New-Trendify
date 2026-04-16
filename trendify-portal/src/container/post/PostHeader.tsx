import { useLocation, useNavigate } from "react-router-dom";
import { memo, useEffect, useState } from "react";
import { App, Dropdown, Flex, MenuProps, Avatar } from "antd";

import "./Post.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { EVisibility } from "@/interfaces/common.interface";
import { EPostActions } from "@/stores/post/constants";
import { useAppDispatch, useAppSelector } from "@/stores";
import { IPost, IPostViewerContext } from "@/interfaces/post.interface";
import { formatDate, formatTimeFromNow, getAvatarUrl } from "@/utils/common.util";
import { deletePostAction, savePostAction, unsavePostAction } from "@/stores/post/actions";

import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";
import Tooltip from "@/components/tooltip/Tooltip";
import ModalSettingPrivacyPost from "@/container/modal/SettingPrivacyPost";

interface PostHeaderProps {
  post: IPost;
  viewerContext: IPostViewerContext;
}

const PostHeader = ({ post, viewerContext }: PostHeaderProps) => {
  const { message, modal, notification } = App.useApp();

  const { author, settings, createdAt } = post;
  const { canDelete, canSave, isAuthor } = viewerContext;
  const currentUserId = useAppSelector((state) => state.auth.user?.id);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [visibleModalPrivacy, setVisibleModalPrivacy] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(viewerContext.isSaved);
  const [currentVisibility, setCurrentVisibility] = useState<EVisibility>(settings.visibility);

  useEffect(() => {
    setIsSaved(viewerContext.isSaved);
  }, [post.id, viewerContext.isSaved]);

  useEffect(() => {
    setCurrentVisibility(settings.visibility);
  }, [post.id, settings.visibility]);

  const handleOpenPrivacyModal = () => {
    if (!isAuthor) return;

    setVisibleModalPrivacy(true);
  };

  const handleDeletePost = async () => {
    if (!post?.id) return;

    modal.confirm({
      centered: true,
      icon: null,
      title: <Text textType="SB16">{`Xoá bài viết?`}</Text>,
      content: <Text>{`Bài viết sẽ bị xoá vĩnh viễn. Bạn không thể khôi phục được nữa.`}</Text>,
      okText: <Text textType="M14">Xoá</Text>,
      cancelText: <Text textType="M14">Huỷ</Text>,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await dispatch(deletePostAction(post.id)).unwrap();

          const isOnDetailPage = location.pathname === ROUTE_PATHS.POST_DETAIL(post.id);
          if (isOnDetailPage) {
            navigate(-1);
          }

          notification.open({
            key: `delete-toast-${post.id}`,
            message: (
              <Flex align="center" justify="space-between" style={{ width: "100%" }}>
                <Text textType="SB16">Đã xoá bài viết</Text>
              </Flex>
            ),
            placement: "bottom",
            duration: 3,
            className: "custom-snackbar-notification",
            closeIcon: null,
          });
        } catch {
          message.error("Xoá bài viết thất bại, vui lòng thử lại.");
        }
      },
    });
  };

  const handleSavePost = async () => {
    try {
      const isCurrentlySaved = isSaved;
      let nextSavedState = isCurrentlySaved;

      if (isCurrentlySaved) {
        const response = await dispatch(unsavePostAction(post.id)).unwrap();
        nextSavedState = response?.isSaved ?? false;
      } else {
        const response = await dispatch(savePostAction(post.id)).unwrap();
        nextSavedState = response?.isSaved ?? true;
      }
      setIsSaved(nextSavedState);

      const toastKey = `save-toast-${post.id}`;
      const isSavedAfterMutation = nextSavedState;

      notification.open({
        key: toastKey,
        message: (
          <Flex align="center" justify="space-between" style={{ width: "100%" }}>
            <Text textType="SB16">{isSavedAfterMutation ? "Đã lưu" : "Đã bỏ lưu"}</Text>
            <Text
              textType="SB16"
              style={{ cursor: "pointer" }}
              onClick={async () => {
                notification.destroy(toastKey);
                if (isSavedAfterMutation) {
                  navigate(ROUTE_PATHS.PROFILE_SAVED(currentUserId ?? author.id));
                  return;
                }

                try {
                  await dispatch(savePostAction(post.id)).unwrap();
                  setIsSaved(true);
                } catch (err) {
                  console.log("undo unsave error: ", err);
                }
              }}
            >
              {isSavedAfterMutation ? "Xem tất cả" : "Hoàn tác"}
            </Text>
          </Flex>
        ),
        placement: "bottom",
        duration: 3,
        className: "custom-snackbar-notification",
        closeIcon: null,
      });
    } catch (error) {
      console.log("save post error: ", error);
    }
  };

  const handleMenuClick: MenuProps["onClick"] = async ({ key }) => {
    try {
      if (key === EPostActions.DELETE_POST) {
        await handleDeletePost();
      }

      if (key === EPostActions.SAVE_POST) {
        await handleSavePost();
      }
    } catch (error) {
      console.log("menu action error: ", error);
    } finally {
      setShowOptions(false);
    }
  };

  const items: MenuProps["items"] = [
    ...(canSave
      ? [
          {
            key: EPostActions.SAVE_POST,
            icon: <Icon name={isSaved ? "BookmarkOffIcon" : "BookmarkOutlineIcon"} size={22} />,
            label: (
              <PostOptionItem
                title={isSaved ? "Bỏ lưu" : "Lưu bài viết"}
                description={isSaved ? "Xoá khỏi danh sách đã lưu" : "Thêm vào danh sách đã lưu"}
              />
            ),
          },
        ]
      : []),
    ...(canSave && canDelete ? [{ type: "divider" as const }] : []),
    ...(canDelete
      ? [
          {
            key: EPostActions.DELETE_POST,
            icon: <Icon name="TrashAltIcon" size={22} />,
            label: <PostOptionItem title="Xoá bài viết" />,
          },
        ]
      : []),
  ];

  const navigateToProfile = () => {
    navigate(ROUTE_PATHS.PROFILE(author.id));
  };

  const isPublic = currentVisibility === EVisibility.public;

  return (
    <Flex className="post-header">
      <Flex gap={8} align="center">
        <Avatar
          className="post-header-avatar"
          src={getAvatarUrl(author.profilePicture)}
          onClick={navigateToProfile}
        />
        <Flex vertical>
          <Flex align="center" gap={4}>
            <Text textType="M14" className="post-author" onClick={navigateToProfile}>
              {`${author.displayName}`}
            </Text>
            {post.location && (
              <Flex align="center" gap={4} className="post-location">
                <Text textType="R14">đang ở</Text>
                <Text textType="M14">{post.location.name}</Text>
              </Flex>
            )}
          </Flex>
          <Flex align="center" gap={6}>
            <Tooltip
              title={formatDate(new Date(createdAt).toISOString(), "dddd, MMMM D, YYYY [at] HH:mm")}
              placement="bottom"
            >
              <Text textType="R12" className="post-created-at">
                {formatTimeFromNow(createdAt)}
              </Text>
            </Tooltip>
            <div className="speator-dot" />
            <Tooltip title={isPublic ? "Public" : "Private"} placement="bottom">
              <Flex className="post-privacy" onClick={handleOpenPrivacyModal}>
                <Icon name={isPublic ? "GlobalIcon" : "LockAltIcon"} size={10} />
              </Flex>
            </Tooltip>
          </Flex>
        </Flex>
      </Flex>
      <Dropdown
        menu={{ items, onClick: handleMenuClick }}
        open={showOptions}
        trigger={["click"]}
        placement="bottomRight"
        onOpenChange={(open) => setShowOptions(open)}
      >
        <Flex className={`post-header-options ${showOptions && "active"}`}>
          <Icon name="EllipsisIcon" size={22} />
        </Flex>
      </Dropdown>

      <ModalSettingPrivacyPost
        postId={post.id}
        visibility={currentVisibility}
        open={isAuthor && visibleModalPrivacy}
        onCancel={() => setVisibleModalPrivacy(false)}
        onSaved={(newVisibility) => setCurrentVisibility(newVisibility)}
      />
    </Flex>
  );
};

const PostOptionItem = ({ description, title }: { description?: string; title: string }) => {
  return (
    <Flex vertical>
      <Text textType="M14">{title}</Text>
      {description && (
        <Text textType="R12" className="text-second-color">
          {description}
        </Text>
      )}
    </Flex>
  );
};

export default memo(PostHeader);
