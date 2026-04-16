import { App, Flex } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import "./PostEditor.scss";
import { useMention } from "@/hooks";
import { EMediaPurpose, EVisibility } from "@/interfaces/common.interface";
import { IPostCreateInput, IPostLocation } from "@/interfaces/post.interface";
import { useAppDispatch, useAppSelector } from "@/stores";

import Modal from "@/components/modal/Modal";
import Button from "@/components/button/Button";
import Text from "@/components/text/Text";
import ComposerPanel from "./panels/ComposerPanel";
import LocationPanel from "./panels/LocationPanel";
import PrivacyPanel from "./panels/PrivacyPanel";
import CropImageModal from "@/container/modal/CropImage";
import { createPostAction } from "@/stores/post/actions";
import { confirmUploadAction, presignedAction } from "@/stores/upload/action";

export type PostPanelKey = "composer" | "location" | "privacy";

type PostPermissionKey = "canLike" | "canComment" | "canSave" | "canShare";

const DEFAULT_POST_PERMISSIONS: Record<PostPermissionKey, boolean> = {
  canLike: true,
  canComment: true,
  canSave: true,
  canShare: true,
};

export interface IPostImage {
  id: string;
  file: File;
  previewUrl: string;
  croppedBlob?: Blob;
  croppedPreviewUrl?: string;
  mediaType: "image" | "video";
  videoDuration?: number;
}

interface IProps {
  opened: boolean;
  onClose: () => void;
}

const PostCreate = ({ opened, onClose }: IProps) => {
  const { editorValue, editorDoc, handleChange, getPayload, reset, appendEmoji } = useMention();
  const authUser = useAppSelector((state) => state.auth.user);
  const { message, notification } = App.useApp();

  const dispatch = useAppDispatch();

  const [activePanel, setActivePanel] = useState<PostPanelKey>("composer");
  const [panelDirection, setPanelDirection] = useState<1 | -1>(1);
  const [selectedLocation, setSelectedLocation] = useState<IPostLocation | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<EVisibility>(EVisibility.public);
  const [postPermissions, setPostPermissions] = useState({ ...DEFAULT_POST_PERMISSIONS });
  const [visibleDraftConfirm, setVisibleDraftConfirm] = useState<boolean>(false);
  const [savingDraft, setSavingDraft] = useState<boolean>(false);
  const [uploadStatusText, setUploadStatusText] = useState<string>("");
  const wasOpenedRef = useRef<boolean>(opened);

  // ======= Media state =======
  const [postImages, setPostImages] = useState<IPostImage[]>([]);
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPanelExiting, setIsPanelExiting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Video limit: max 1 video per post, max 50MB, max 60 seconds
  const VIDEO_MAX_SIZE = 50 * 1024 * 1024;
  const VIDEO_MAX_DURATION = 60;
  const hasVideo = postImages.some((m) => m.mediaType === "video");

  const panelOrder = useMemo<PostPanelKey[]>(() => ["composer", "location", "privacy"], []);

  const hasDraftChanges = useMemo(() => {
    const hasContent = editorValue.trim().length > 0;
    const hasLocation = !!selectedLocation;
    const hasVisibilityChanged = selectedVisibility !== EVisibility.public;
    const hasPermissionsChanged = (
      Object.keys(DEFAULT_POST_PERMISSIONS) as PostPermissionKey[]
    ).some((key) => postPermissions[key] !== DEFAULT_POST_PERMISSIONS[key]);
    const hasMedia = postImages.length > 0;

    return hasContent || hasLocation || hasVisibilityChanged || hasPermissionsChanged || hasMedia;
  }, [editorValue, postPermissions, selectedLocation, selectedVisibility, postImages]);

  const resetPostCreateForm = useCallback(() => {
    setActivePanel("composer");
    setPanelDirection(1);
    setSelectedLocation(null);
    setSelectedVisibility(EVisibility.public);
    setPostPermissions({ ...DEFAULT_POST_PERMISSIONS });
    setVisibleDraftConfirm(false);
    setSavingDraft(false);
    setIsUploading(false);
    setIsPanelExiting(false);
    setUploadStatusText("");

    // Clean up image blob URLs
    postImages.forEach((img) => {
      URL.revokeObjectURL(img.previewUrl);
      if (img.croppedPreviewUrl) URL.revokeObjectURL(img.croppedPreviewUrl);
    });
    setPostImages([]);
    setCropIndex(null);
    setIsCropOpen(false);

    reset();
  }, [reset, postImages]);

  const closeModalImmediately = useCallback(() => {
    resetPostCreateForm();
    onClose();
  }, [onClose, resetPostCreateForm]);

  const handleRequestCloseModal = useCallback(() => {
    if (!hasDraftChanges) {
      closeModalImmediately();
      return;
    }

    setVisibleDraftConfirm(true);
  }, [closeModalImmediately, hasDraftChanges]);

  useEffect(() => {
    if (wasOpenedRef.current && !opened) {
      resetPostCreateForm();
    }
    wasOpenedRef.current = opened;
  }, [opened, resetPostCreateForm]);

  const onNavigatePanel = (panel: PostPanelKey) => {
    if (panel === activePanel) return;

    const currentIndex = panelOrder.indexOf(activePanel);
    const nextIndex = panelOrder.indexOf(panel);

    // If navigating back to composer from location/privacy, mark as exiting
    if (panel === "composer" && activePanel !== "composer") {
      setIsPanelExiting(true);
    }

    setPanelDirection(nextIndex > currentIndex ? 1 : -1);
    setActivePanel(panel);
  };

  // ======= Image handlers =======
  const handleOpenImagePicker = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const getVideoDuration = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(0);
      };
      video.src = URL.createObjectURL(file);
    });
  }, []);

  const generateVideoThumbnail = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      const timeout = setTimeout(() => {
        URL.revokeObjectURL(video.src);
        resolve("");
      }, 2000);

      video.onloadeddata = () => {
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.8);
        URL.revokeObjectURL(video.src);
        resolve(thumbnailUrl);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(video.src);
        resolve("");
      };

      video.src = URL.createObjectURL(file);
    });
  }, []);

  const handleImageFilesSelected = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newMedia: IPostImage[] = [];
      let firstImageIndex = -1;

      for (const file of Array.from(files)) {
        if (postImages.length + newMedia.length >= 10) {
          message.warning("Bạn chỉ có thể đăng tối đa 10 tệp media (ảnh/video) mỗi bài viết.");
          break;
        }

        const isVideoFile = file.type.startsWith("video/");
        const isImageFile = file.type.startsWith("image/");

        if (!isVideoFile && !isImageFile) continue;

        if (isVideoFile) {
          // Validate: only 1 video per post
          if (hasVideo || newMedia.some((m) => m.mediaType === "video")) {
            message.warning("Chỉ có thể đăng tối đa 1 video mỗi bài viết.");
            continue;
          }

          // Validate size
          if (file.size > VIDEO_MAX_SIZE) {
            message.warning("Video không được vượt quá 50MB.");
            continue;
          }

          // Validate duration
          const duration = await getVideoDuration(file);
          if (duration > VIDEO_MAX_DURATION) {
            message.warning(`Video không được dài quá ${VIDEO_MAX_DURATION} giây. Video của bạn dài ${Math.round(duration)} giây.`);
            continue;
          }

          // Generate thumbnail for preview
          const thumbnailUrl = await generateVideoThumbnail(file);

          newMedia.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            previewUrl: thumbnailUrl || URL.createObjectURL(file),
            mediaType: "video",
            videoDuration: Math.round(duration),
          });
        } else {
          // Image file
          if (firstImageIndex === -1) {
            firstImageIndex = postImages.length + newMedia.length;
          }

          newMedia.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            previewUrl: URL.createObjectURL(file),
            mediaType: "image",
          });
        }
      }

      if (newMedia.length === 0) return;

      setPostImages((prev) => [...prev, ...newMedia]);

      // Open crop only for the first new IMAGE (skip video)
      if (firstImageIndex !== -1) {
        setCropIndex(firstImageIndex);
        setIsCropOpen(true);
      }

      e.target.value = "";
    },
    [postImages.length, hasVideo, message, getVideoDuration, generateVideoThumbnail],
  );

  const handleCropImage = useCallback(
    async (croppedArea: import("react-easy-crop").Area) => {
      if (cropIndex === null || !postImages[cropIndex]) return;

      const { getCroppedImg } = await import("@/utils/common.util");
      const img = postImages[cropIndex];
      const srcUrl = img.previewUrl;

      const blob = await getCroppedImg(srcUrl, croppedArea);
      const croppedPreviewUrl = URL.createObjectURL(blob);

      setPostImages((prev) =>
        prev.map((item, idx) =>
          idx === cropIndex
            ? { ...item, croppedBlob: blob, croppedPreviewUrl }
            : item,
        ),
      );

      // Move to next un-cropped image if any
      const nextUncropped = postImages.findIndex(
        (img, idx) => idx > cropIndex && !img.croppedBlob,
      );

      if (nextUncropped !== -1) {
        setCropIndex(nextUncropped);
      } else {
        setIsCropOpen(false);
        setCropIndex(null);
      }
    },
    [cropIndex, postImages],
  );

  const handleCloseCrop = useCallback(() => {
    setIsCropOpen(false);
    setCropIndex(null);
  }, []);

  const handleRemoveImage = useCallback((imageId: string) => {
    setPostImages((prev) => {
      const target = prev.find((img) => img.id === imageId);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        if (target.croppedPreviewUrl) URL.revokeObjectURL(target.croppedPreviewUrl);
      }
      return prev.filter((img) => img.id !== imageId);
    });
  }, []);

  const handleRecropImage = useCallback(
    (index: number) => {
      if (!postImages[index]) return;
      setCropIndex(index);
      setIsCropOpen(true);
    },
    [postImages],
  );

  // ======= Upload all media (images + videos) to S3 =======
  const uploadAllImages = useCallback(async (): Promise<string[]> => {
    const mediaIds: string[] = [];
    const total = postImages.length;

    for (let i = 0; i < total; i++) {
      const media = postImages[i];
      setUploadStatusText(`Đang tải thư viện ${i + 1}/${total}...`);
      
      const isVideo = media.mediaType === "video";
      // For videos, always use the original file (no cropping)
      const blob = isVideo ? media.file : (media.croppedBlob || media.file);
      const contentType = blob.type || (isVideo ? "video/mp4" : "image/jpeg");
      const filename = media.file.name || (isVideo ? "post-video.mp4" : "post-image.jpg");

      const response = await dispatch(
        presignedAction({
          purpose: EMediaPurpose.POST_MEDIA,
          filename,
          contentType,
          size: blob.size,
        }),
      ).unwrap();

      if (!response) throw new Error("Get presigned url failed");

      const { uploadUrl, mediaId } = response;

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": contentType },
      });

      if (!uploadRes.ok) throw new Error("S3 Upload failed");

      await dispatch(confirmUploadAction({ mediaId })).unwrap();
      mediaIds.push(mediaId);
    }

    return mediaIds;
  }, [dispatch, postImages]);

  // ======= Build payload =======
  const buildPostPayload = useCallback(
    (isDraft?: boolean, mediaIds?: string[]): IPostCreateInput | null => {
      if (!authUser?.id) return null;

      const mentionPayload = getPayload();

      return {
        authorId: authUser.id,
        content: mentionPayload.content,
        mediaIds: mediaIds && mediaIds.length > 0 ? mediaIds : undefined,
        mentions: mentionPayload.mentions,
        location: selectedLocation ?? undefined,
        visibility: selectedVisibility,
        allowLike: postPermissions.canLike,
        allowComment: postPermissions.canComment,
        allowSave: postPermissions.canSave,
        allowShare: postPermissions.canShare,
        isDraft: isDraft || undefined,
      };
    },
    [authUser?.id, getPayload, postPermissions, selectedLocation, selectedVisibility],
  );

  const handleSubmit = async () => {
    try {
      setIsUploading(true);

      // Upload images first
      let mediaIds: string[] = [];
      if (postImages.length > 0) {
        mediaIds = await uploadAllImages();
      }

      setUploadStatusText("Đang xử lý bài viết...");
      const payload = buildPostPayload(false, mediaIds);
      if (!payload) return;

      await dispatch(createPostAction(payload)).unwrap();

      notification.open({
        key: `create-post-toast-${Date.now()}`,
        message: (
          <Flex align="center" justify="space-between" style={{ width: "100%" }}>
            <Text textType="SB16">Đã đăng bài viết</Text>
          </Flex>
        ),
        placement: "bottom",
        duration: 3,
        className: "custom-snackbar-notification",
        closeIcon: null,
      });

      closeModalImmediately();
    } catch {
      message.error("Đăng bài viết thất bại, vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSavingDraft(true);
      setIsUploading(true);

      let mediaIds: string[] = [];
      if (postImages.length > 0) {
        mediaIds = await uploadAllImages();
      }

      setUploadStatusText("Đang lưu bản nháp...");
      const payload = buildPostPayload(true, mediaIds);
      if (!payload) return;

      await dispatch(createPostAction(payload)).unwrap();

      notification.open({
        key: `save-draft-toast-${Date.now()}`,
        message: (
          <Flex align="center" justify="space-between" style={{ width: "100%" }}>
            <Text textType="SB16">Đã lưu bản nháp</Text>
          </Flex>
        ),
        placement: "bottom",
        duration: 3,
        className: "custom-snackbar-notification",
        closeIcon: null,
      });

      closeModalImmediately();
    } catch {
      message.error("Lưu bản nháp thất bại, vui lòng thử lại.");
    } finally {
      setSavingDraft(false);
      setIsUploading(false);
    }
  };

  const currentCropSrc =
    cropIndex !== null && postImages[cropIndex]
      ? postImages[cropIndex].previewUrl
      : null;

  return (
    <>
      <Modal
        open={opened}
        width={720}
        closable={false}
        onCancel={handleRequestCloseModal}
        footer={null}
        maskClosable={false}
        destroyOnHidden
        className="post-create-modal"
      >
        <Flex vertical className="post-modal-shell">
          {/* ComposerPanel — always mounted to preserve TipTap editor state */}
          <div style={{
            display: activePanel === "composer" && !isPanelExiting ? "block" : "none",
          }}>
            <ComposerPanel
              selectedLocation={selectedLocation}
              editorValue={editorValue}
              editorDoc={editorDoc}
              handleChange={handleChange}
              appendEmoji={appendEmoji}
              onSubmit={handleSubmit}
              onCloseModal={handleRequestCloseModal}
              onNavigatePanel={onNavigatePanel}
              postImages={postImages}
              isUploading={isUploading || savingDraft}
              uploadStatusText={uploadStatusText}
              onOpenImagePicker={handleOpenImagePicker}
              onRemoveImage={handleRemoveImage}
              onRecropImage={handleRecropImage}
            />
          </div>

          {/* Location & Privacy panels — animate in/out */}
          <AnimatePresence
            initial={false}
            custom={panelDirection}
            onExitComplete={() => setIsPanelExiting(false)}
          >
            {activePanel === "location" && (
              <motion.div
                key="location"
                custom={panelDirection}
                variants={{
                  enter: (direction: 1 | -1) => ({ x: direction > 0 ? "12%" : "-12%", opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (direction: 1 | -1) => ({ x: direction > 0 ? "-12%" : "12%", opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="post-panel-transition"
              >
                <LocationPanel
                  selectedLocation={selectedLocation}
                  onSelect={setSelectedLocation}
                  onBack={() => onNavigatePanel("composer")}
                />
              </motion.div>
            )}

            {activePanel === "privacy" && (
              <motion.div
                key="privacy"
                custom={panelDirection}
                variants={{
                  enter: (direction: 1 | -1) => ({ x: direction > 0 ? "12%" : "-12%", opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (direction: 1 | -1) => ({ x: direction > 0 ? "-12%" : "12%", opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.12, ease: "easeOut" }}
                className="post-panel-transition"
              >
                <PrivacyPanel
                  visibility={selectedVisibility}
                  canLike={postPermissions.canLike}
                  canComment={postPermissions.canComment}
                  canSave={postPermissions.canSave}
                  canShare={postPermissions.canShare}
                  onSelect={setSelectedVisibility}
                  onTogglePermission={(key, value) => {
                    setPostPermissions((prev) => ({
                      ...prev,
                      [key]: value,
                    }));
                  }}
                  onBack={() => onNavigatePanel("composer")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Flex>
      </Modal>

      {/* Hidden file input for images + videos */}
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
        multiple
        ref={imageInputRef}
        style={{ display: "none" }}
        onChange={handleImageFilesSelected}
      />

      {/* Crop modal */}
      {currentCropSrc && (
        <CropImageModal
          open={isCropOpen}
          imageSrc={currentCropSrc}
          aspect={1}
          onCancel={handleCloseCrop}
          onCrop={handleCropImage}
        />
      )}

      <Modal
        open={visibleDraftConfirm}
        width={332}
        closable={false}
        onCancel={() => setVisibleDraftConfirm(false)}
        footer={null}
        maskClosable={false}
        destroyOnHidden
        className="post-draft-confirm-modal"
      >
        <Flex vertical className="post-draft-confirm">
          <Flex vertical className="post-draft-confirm__header">
            <Text textType="SB22">Lưu làm bản nháp?</Text>
            <Text textType="R16" className="post-draft-confirm__description">
              Lưu bản nháp để chỉnh sửa và đăng vào lúc khác.
            </Text>
          </Flex>

          <Button
            type="text"
            className="post-draft-confirm__action"
            onClick={handleSaveDraft}
            loading={savingDraft}
          >
            <Text textType="SB16">Lưu</Text>
          </Button>

          <Button
            type="text"
            className="post-draft-confirm__action"
            onClick={closeModalImmediately}
            disabled={savingDraft}
          >
            <Text textType="SB16" style={{ color: "var(--color-error)" }}>
              Không lưu
            </Text>
          </Button>

          <Button
            type="text"
            className="post-draft-confirm__action"
            onClick={() => setVisibleDraftConfirm(false)}
            disabled={savingDraft}
          >
            <Text textType="SB16">Hủy</Text>
          </Button>
        </Flex>
      </Modal>
    </>
  );
};

export default PostCreate;
