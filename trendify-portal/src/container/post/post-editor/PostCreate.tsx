import { App, Flex } from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import "./PostEditor.scss";
import { useMention } from "@/hooks";
import { EVisibility } from "@/interfaces/common.interface";
import { IPostCreateInput, IPostLocation } from "@/interfaces/post.interface";
import { useAppDispatch, useAppSelector } from "@/stores";

import Modal from "@/components/modal/Modal";
import Button from "@/components/button/Button";
import Text from "@/components/text/Text";
import ComposerPanel from "./panels/ComposerPanel";
import LocationPanel from "./panels/LocationPanel";
import PrivacyPanel from "./panels/PrivacyPanel";
import { createPostAction } from "@/stores/post/actions";

export type PostPanelKey = "composer" | "location" | "privacy";

type PostPermissionKey = "canLike" | "canComment" | "canSave" | "canShare";

const DEFAULT_POST_PERMISSIONS: Record<PostPermissionKey, boolean> = {
  canLike: true,
  canComment: true,
  canSave: true,
  canShare: true,
};

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
  const wasOpenedRef = useRef<boolean>(opened);

  const panelOrder = useMemo<PostPanelKey[]>(() => ["composer", "location", "privacy"], []);

  const hasDraftChanges = useMemo(() => {
    const hasContent = editorValue.trim().length > 0;
    const hasLocation = !!selectedLocation;
    const hasVisibilityChanged = selectedVisibility !== EVisibility.public;
    const hasPermissionsChanged = (
      Object.keys(DEFAULT_POST_PERMISSIONS) as PostPermissionKey[]
    ).some((key) => postPermissions[key] !== DEFAULT_POST_PERMISSIONS[key]);
    const hasMedia = false; // TODO: use real media state when media upload is integrated.

    return hasContent || hasLocation || hasVisibilityChanged || hasPermissionsChanged || hasMedia;
  }, [editorValue, postPermissions, selectedLocation, selectedVisibility]);

  const resetPostCreateForm = useCallback(() => {
    setActivePanel("composer");
    setPanelDirection(1);
    setSelectedLocation(null);
    setSelectedVisibility(EVisibility.public);
    setPostPermissions({ ...DEFAULT_POST_PERMISSIONS });
    setVisibleDraftConfirm(false);
    setSavingDraft(false);
    reset();
  }, [reset]);

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

    setPanelDirection(nextIndex > currentIndex ? 1 : -1);
    setActivePanel(panel);
  };

  const buildPostPayload = useCallback(
    (isDraft?: boolean): IPostCreateInput | null => {
      if (!authUser?.id) return null;

      const mentionPayload = getPayload();

      return {
        authorId: authUser.id,
        content: mentionPayload.content,
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
    const payload = buildPostPayload(false);
    if (!payload) return;

    try {
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
    }
  };

  const handleSaveDraft = async () => {
    const payload = buildPostPayload(true);
    if (!payload) return;

    try {
      setSavingDraft(true);
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
    }
  };

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
          <AnimatePresence initial={false} custom={panelDirection} mode="wait">
            <motion.div
              key={activePanel}
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
              {activePanel === "composer" && (
                <ComposerPanel
                  selectedLocation={selectedLocation}
                  editorValue={editorValue}
                  editorDoc={editorDoc}
                  handleChange={handleChange}
                  appendEmoji={appendEmoji}
                  onSubmit={handleSubmit}
                  onCloseModal={handleRequestCloseModal}
                  onNavigatePanel={onNavigatePanel}
                />
              )}

              {activePanel === "location" && (
                <LocationPanel
                  selectedLocation={selectedLocation}
                  onSelect={setSelectedLocation}
                  onBack={() => onNavigatePanel("composer")}
                />
              )}

              {activePanel === "privacy" && (
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
              )}
            </motion.div>
          </AnimatePresence>
        </Flex>
      </Modal>

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
