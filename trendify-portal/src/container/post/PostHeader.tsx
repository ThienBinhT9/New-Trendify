import { useNavigate } from "react-router-dom";
import { memo, useState } from "react";
import { Avatar, Dropdown, Flex, MenuProps } from "antd";

import "./Post.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { formatDate, formatTimeFromNow } from "@/utils/common.util";

import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";
import Tooltip from "@/components/tooltip/Tooltip";
import ModalSettingPrivacyPost from "@/container/modal/SettingPrivacyPost";
import { IPost, IPostViewerContext } from "@/interfaces/post.interface";
import { EVisibility } from "@/interfaces/common.interface";

interface PostHeaderProps {
  post: IPost;
  viewerContext: IPostViewerContext;
}

const PostHeader = ({ post, viewerContext }: PostHeaderProps) => {
  const { author, settings, createdAt } = post;
  const { canEdit, canDelete, canSave } = viewerContext;

  const navigate = useNavigate();

  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [visibleModalPrivacy, setVisibleModalPrivacy] = useState<boolean>(false);

  const items: MenuProps["items"] = [
    ...(canSave
      ? [
          {
            key: "save",
            icon: <Icon name="SaveAltIcon" size={22} />,
            label: <PostOptionItem title="Lưu bài viết" description="Thêm vào danh sách đã lưu" />,
          },
        ]
      : []),
    ...((canEdit || canSave) && canDelete ? [{ type: "divider" as const }] : []),
    ...(canDelete
      ? [
          {
            key: "delete",
            icon: <Icon name="TrashAltIcon" size={22} />,
            label: <PostOptionItem title="Xoá bài viết" />,
          },
        ]
      : []),
  ];

  const navigateToProfile = () => {
    navigate(ROUTE_PATHS.PROFILE(author.id));
  };

  const isPublic = settings.visibility === EVisibility.public;

  return (
    <Flex className="post-header">
      <Flex gap={8} align="center">
        <Avatar
          className="post-header-avatar"
          src={author.profilePicture}
          onClick={navigateToProfile}
        />
        <Flex vertical>
          <Text textType="M14" className="post-author" onClick={navigateToProfile}>
            {`${author.firstName} ${author.lastName}`}
          </Text>
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
              <Flex className="post-privacy" onClick={() => setVisibleModalPrivacy(true)}>
                <Icon name={isPublic ? "GlobalIcon" : "LockAltIcon"} size={10} />
              </Flex>
            </Tooltip>
          </Flex>
        </Flex>
      </Flex>
      <Dropdown
        menu={{ items }}
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
        visibility={settings.visibility}
        open={visibleModalPrivacy}
        onCancel={() => setVisibleModalPrivacy(false)}
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
