import {
  App,
  Avatar,
  Divider,
  Dropdown,
  Flex,
  MenuProps,
  Modal,
  Skeleton,
  Tabs,
  TabsProps,
} from "antd";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import "./Profile.scss";
import dayjs from "dayjs";

import { UploadIcon, EllipsisIcon } from "@/assets/icons/Icon";
import ROUTE_PATHS, { SUB_PATH_PROFILE } from "@/routes/path.route";
import { blockAction } from "@/stores/follow/actions";
import { EMediaPurpose } from "@/interfaces/common.interface";
import { getProfileTab } from "@/utils/common.util";
import { EProfileActions } from "@/stores/profile/constants";
import { useImageUploadCrop } from "@/hooks";
import { useAppDispatch, useAppSelector } from "@/stores";
import { confirmUploadAction, presignedAction } from "@/stores/upload/action";
import { updateProfileAction, userProfileAction } from "@/stores/profile/actions";

import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";
import Image from "@/components/image/Image";
import Button from "@/components/button/Button";
import NotFound from "../not-found/NotFound";
import CropImageModal from "@/container/modal/CropImage";
import FollowStatusCard from "@/container/card/FollowStatusCard";
import FollowRequestCard from "@/container/card/FollowRequestCard";

const profile_tabs: TabsProps["items"] = [
  { key: "", label: "Bài viết" },
  { key: SUB_PATH_PROFILE.INTRODUCE, label: "Giới thiệu" },
  { key: SUB_PATH_PROFILE.FRIENDS, label: "Bạn bè" },
];

const Profile = () => {
  const { message, modal } = App.useApp();
  const { profile, isOwnProfile, errorStatus } = useAppSelector((state) => state.profile);

  const loadingGetProfile = useAppSelector((state) => state.loading[EProfileActions.USER_PROFILE]);

  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { id: userId } = useParams();

  const currentTab = getProfileTab(location.pathname);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isIntroduceOpen, setIsIntroduceOpen] = useState<boolean>(false);

  const avatarUpload = useImageUploadCrop({
    aspect: 1,
    uploadAction: async (blob) => {
      const response = await dispatch(
        presignedAction({
          purpose: EMediaPurpose.PROFILE_PICTURE,
          filename: "avatar.jpg",
          contentType: blob.type,
          size: blob.size,
        }),
      ).unwrap();

      if (!response) return;

      const { uploadUrl, mediaId } = response;

      await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": blob.type },
      });

      await dispatch(confirmUploadAction({ mediaId })).unwrap();
      await dispatch(updateProfileAction({ profilePicture: mediaId })).unwrap();
    },
    reloadAction: async () => {},
  });

  const coverUpload = useImageUploadCrop({
    aspect: 3 / 1,
    uploadAction: async (blob) => {
      const response = await dispatch(
        presignedAction({
          purpose: EMediaPurpose.COVER_PICTURE,
          filename: "cover.jpg",
          contentType: blob.type,
          size: blob.size,
        }),
      ).unwrap();

      if (!response) return;

      const { uploadUrl, mediaId } = response;

      await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": blob.type },
      });

      await dispatch(confirmUploadAction({ mediaId })).unwrap();
      await dispatch(updateProfileAction({ coverPicture: mediaId })).unwrap();
    },
    reloadAction: async () => {},
  });

  const handleCopyLink = async () => {
    const profileUrl = `${window.location.origin}/profile/${userId}`;
    console.log({ profileUrl });

    navigator.clipboard.writeText(profileUrl).then(() => {
      message.success("Đã sao chép liên kết");
    });
  };

  const handleBlockUser = () => {
    if (!userId) return;
    const username = profile?.username ?? "người dùng này";
    modal.confirm({
      centered: true,
      className: "profile-block-confirm",
      icon: null,
      title: (
        <Text textType="M18" className="profile-block-confirm__title">{`Chặn ${username}?`}</Text>
      ),
      content: (
        <Text className="profile-block-confirm__body">
          {`${username} sẽ không thể tìm thấy trang cá nhân hay nội dung của bạn. Sẽ không có ai nhìn
          thấy câu trả lời của họ cho bài viết của bạn. Họ cũng không được thông báo là bạn đã chặn
          họ.`}
        </Text>
      ),
      okText: <Text textType="M14">Chặn</Text>,
      cancelText: <Text textType="M14">Hủy</Text>,
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await dispatch(blockAction(userId)).unwrap();
          message.success("Đã chặn người dùng");
          navigate(ROUTE_PATHS.HOME);
        } catch {
          message.error("Chặn người dùng thất bại, vui lòng thử lại.");
        }
      },
    });
  };

  const avatar_dropdown: MenuProps["items"] = [
    {
      key: "view-avatar",
      label: "Xem ảnh đại diện",
      icon: <Icon name="UserCircleGrayIcon" size={20} />,
      onClick: () => setIsPreviewOpen(true),
    },
    ...(isOwnProfile
      ? [
          {
            key: "edit-avatar",
            label: "Chọn ảnh đại diện",
            icon: <Icon name="UploadIcon" size={18} />,
            onClick: avatarUpload.openFilePicker,
          },
        ]
      : []),
  ];

  const cover_avatar_dropdown: MenuProps["items"] = [
    {
      key: "upload-cover-picture",
      label: "Chọn ảnh bìa",
      icon: <UploadIcon width={18} height={18} />,
      onClick: coverUpload.openFilePicker,
    },
    ...(profile?.coverPicture
      ? [
          { type: "divider" } as const,
          {
            key: "remove-cover-picture",
            label: "Xóa ảnh bìa",
            icon: <Icon name="TrashAltIcon" size={20} />,
          },
        ]
      : []),
  ];

  const options_user_dropdown: MenuProps["items"] = [
    {
      key: "copy-link",
      label: "Sao chép liên kết",
      extra: <Icon name="LinkAltIcon" size={18} />,
      onClick: handleCopyLink,
    },
    {
      key: "introducing-profile",
      label: "Giới thiệu trang cá nhân",
      extra: <Icon name="UserCircleGrayIcon" size={18} />,
      onClick: () => setIsIntroduceOpen(true),
    },
    ...(!isOwnProfile
      ? [
          { type: "divider" } as const,
          {
            key: "block-user",
            label: <Text style={{ color: "var(--color-error)" }}>Chặn người dùng</Text>,
            onClick: handleBlockUser,
          },
        ]
      : []),
  ];

  const normalizeTab = (tab?: string) => {
    if (!tab) return "";

    if (tab === SUB_PATH_PROFILE.FOLLOWERS || tab === SUB_PATH_PROFILE.FOLLOWING) {
      return SUB_PATH_PROFILE.FRIENDS;
    }

    if (tab === SUB_PATH_PROFILE.PERSONAL_DETAIL) {
      return SUB_PATH_PROFILE.INTRODUCE;
    }

    return tab;
  };

  const handleChangeTab = (tab: string) => {
    navigate(`${ROUTE_PATHS.PROFILE(userId)}${tab}`);
  };

  const handleGetProfile = useCallback(async () => {
    try {
      if (!userId) return;

      await dispatch(userProfileAction(userId)).unwrap();
    } catch (error) {
      console.log("error: ", error);
    }
  }, [userId, dispatch]);

  useEffect(() => {
    handleGetProfile();
  }, [handleGetProfile]);

  if (errorStatus || !userId) {
    return <NotFound />;
  }

  return (
    <Flex className="profile-container">
      <Flex className="profile-header">
        {profile?.viewerContext && (
          <FollowRequestCard
            relationship={{
              viewerContext: profile?.viewerContext,
              id: profile?.id,
              firstName: profile?.firstName,
              lastName: profile?.lastName,
            }}
          />
        )}
        <Flex className="header-cover-image">
          {loadingGetProfile ? (
            <Skeleton.Image active className="cover-image-skeleton" />
          ) : (
            <>
              <Image
                className="cover-image"
                src={coverUpload.localPreview || profile?.coverPicture?.original}
                preview={{ mask: null }}
              />

              {isOwnProfile && (
                <Dropdown
                  menu={{ items: cover_avatar_dropdown }}
                  trigger={["click"]}
                  placement="bottom"
                  disabled={loadingGetProfile}
                >
                  <Button className="edit-cover-btn" icon={<Icon name="CameraIcon" size={18} />}>
                    <Text textType="M14">Chỉnh sửa ảnh bìa</Text>
                  </Button>
                </Dropdown>
              )}
            </>
          )}
        </Flex>
        <Flex vertical className="pl-32 pr-32">
          <Flex className="header-info">
            <Flex className="header-info-avatar">
              <Dropdown
                arrow
                menu={{ items: avatar_dropdown }}
                trigger={["click"]}
                placement="bottom"
                disabled={loadingGetProfile}
              >
                <Avatar
                  className="avatar"
                  src={avatarUpload.localPreview || profile?.profilePicture?.medium}
                />
              </Dropdown>
              <Image
                style={{ display: "none" }}
                src={avatarUpload.localPreview || profile?.profilePicture?.original}
                preview={{
                  visible: isPreviewOpen,
                  onVisibleChange: (vis) => setIsPreviewOpen(vis),
                }}
              />
            </Flex>
            <Flex className="header-info-detail">
              <Flex vertical gap={8} flex={1}>
                <Skeleton
                  title={{ width: "40%", style: { height: 24 } }}
                  loading={loadingGetProfile}
                  paragraph={{ rows: 2 }}
                  active
                >
                  <Text
                    textType="SB22"
                    className="profile-name-link"
                    onClick={() => setIsIntroduceOpen(true)}
                  >{`${profile?.lastName} ${profile?.firstName}`}</Text>
                  <Flex gap={6}>
                    <Text
                      textType="M14"
                      className="header-info-folow"
                      onClick={() => navigate(ROUTE_PATHS.PROFILE_FOLLOWERS(userId))}
                    >{`${profile?.followerCount} nguời theo dõi`}</Text>
                    <Text textType="M14">{`•`}</Text>
                    <Text
                      textType="M14"
                      className="header-info-folow"
                      onClick={() => navigate(ROUTE_PATHS.PROFILE_FOLLOWING(userId))}
                    >{`${profile?.followingCount} đang theo dõi`}</Text>
                  </Flex>
                  {profile?.about && <Text>{`${profile?.about}`}</Text>}
                </Skeleton>
              </Flex>
              {!loadingGetProfile &&
                (isOwnProfile ? (
                  <Flex gap={6}>
                    <Button
                      className="header-info-btn"
                      icon={<Icon name="PenIcon" size={14} />}
                      onClick={() => handleChangeTab(SUB_PATH_PROFILE.INTRODUCE)}
                    >
                      <Text textType="M14">Chỉnh sửa trang cá nhân</Text>
                    </Button>
                  </Flex>
                ) : (
                  <Flex gap={6}>
                    <Button
                      className="header-info-btn"
                      icon={<Icon name="MessengerIcon" size={18} />}
                      onClick={() => navigate(ROUTE_PATHS.MESSAGE)}
                    >
                      <Text textType="M14">Message</Text>
                    </Button>
                    {profile?.viewerContext && (
                      <FollowStatusCard
                        relationship={{
                          viewerContext: profile?.viewerContext,
                          id: profile?.id,
                          firstName: profile?.firstName,
                          lastName: profile?.lastName,
                          username: profile?.username,
                        }}
                      />
                    )}
                  </Flex>
                ))}
            </Flex>
          </Flex>
          <Divider className="profile-header-divider" />
          <Flex justify="space-between">
            <Tabs
              defaultActiveKey={profile_tabs[0].key}
              activeKey={normalizeTab(currentTab)}
              items={profile_tabs.map((tab) => ({
                ...tab,
                disabled: loadingGetProfile,
              }))}
              className="custom-tabs"
              onChange={handleChangeTab}
            />
            <Dropdown
              menu={{ items: options_user_dropdown }}
              trigger={["click"]}
              disabled={loadingGetProfile}
              placement="bottomRight"
            >
              <Button
                className="header-info-btn"
                style={{ width: 30, height: 26 }}
                icon={<EllipsisIcon style={{ width: 22, height: 22 }} />}
              />
            </Dropdown>
          </Flex>
        </Flex>
      </Flex>

      <Modal
        open={isIntroduceOpen}
        onCancel={() => setIsIntroduceOpen(false)}
        footer={null}
        centered
        className="profile-introduce-modal"
        closable={false}
      >
        <div className="profile-introduce-modal__content">
          <div className="profile-introduce-modal__main">
            <div className="profile-introduce-modal__row">
              <Text textType="SB16">Tên</Text>
              <Text>
                {`${
                  profile
                    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") ||
                      profile.username
                    : "—"
                } ${profile?.username ? `(@${profile.username})` : ""}`}
              </Text>
            </div>
            <div className="profile-introduce-modal__row">
              <Text textType="SB16">Ngày tham gia</Text>
              <Text>
                {profile?.createdAt
                  ? `Tháng ${dayjs(profile.createdAt).format("M")} năm ${dayjs(profile.createdAt).format("YYYY")}`
                  : "—"}
              </Text>
            </div>
            <div className="profile-introduce-modal__row">
              <Text textType="SB16">Ngày sinh</Text>
              <Text>
                {profile?.dateOfBirth ? dayjs(profile.dateOfBirth).format("DD/MM/YYYY") : "—"}
              </Text>
            </div>
          </div>
          <div className="profile-introduce-modal__avatar">
            <Avatar
              size={72}
              src={profile?.profilePicture?.large || profile?.profilePicture?.original}
            >
              <Text textType="M32">{`${profile?.username?.[0]?.toUpperCase()}`}</Text>
            </Avatar>
          </div>
        </div>
      </Modal>

      {/* Content */}
      <Outlet />

      {/* ======================= Start Upload ======================= */}
      <input
        type="file"
        accept="image/*"
        ref={avatarUpload.inputRef}
        style={{ display: "none" }}
        onChange={avatarUpload.handleFileChange}
      />
      {avatarUpload.imageSrc && (
        <CropImageModal
          cropShape="round"
          open={avatarUpload.isCropOpen}
          imageSrc={avatarUpload.imageSrc}
          aspect={avatarUpload.aspect}
          onCancel={avatarUpload.closeCrop}
          onCrop={avatarUpload.handleCrop}
        />
      )}
      <input
        type="file"
        accept="image/*"
        ref={coverUpload.inputRef}
        style={{ display: "none" }}
        onChange={coverUpload.handleFileChange}
      />
      {coverUpload.imageSrc && (
        <CropImageModal
          open={coverUpload.isCropOpen}
          imageSrc={coverUpload.imageSrc}
          aspect={coverUpload.aspect}
          onCancel={coverUpload.closeCrop}
          onCrop={coverUpload.handleCrop}
        />
      )}
      {/* ======================= End Upload ======================= */}
    </Flex>
  );
};

export default Profile;
