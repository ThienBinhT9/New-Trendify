import { Flex } from "antd";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import "./PostEditor.scss";
import { useMention } from "@/hooks";
import { EVisibility } from "@/interfaces/common.interface";
import { EPostType, IPostCreateInput, IPostLocation } from "@/interfaces/post.interface";
import { useAppSelector } from "@/stores";

import Modal from "@/components/modal/Modal";
import ComposerPanel from "./panels/ComposerPanel";
import LocationPanel from "./panels/LocationPanel";
import PrivacyPanel from "./panels/PrivacyPanel";

export type PostPanelKey = "composer" | "location" | "privacy";

interface IProps {
  opened: boolean;
  onClose: () => void;
}

const PostCreate = ({ opened, onClose }: IProps) => {
  const { editorValue, editorDoc, handleChange, getPayload, appendEmoji } = useMention();
  const authUser = useAppSelector((state) => state.auth.user);

  const [activePanel, setActivePanel] = useState<PostPanelKey>("composer");
  const [panelDirection, setPanelDirection] = useState<1 | -1>(1);
  const [selectedLocation, setSelectedLocation] = useState<IPostLocation | null>(null);
  const [selectedVisibility, setSelectedVisibility] = useState<EVisibility>(EVisibility.public);

  const panelOrder = useMemo<PostPanelKey[]>(() => ["composer", "location", "privacy"], []);

  const onCloseModal = () => {
    setActivePanel("composer");
    onClose();
  };

  const onNavigatePanel = (panel: PostPanelKey) => {
    if (panel === activePanel) return;

    const currentIndex = panelOrder.indexOf(activePanel);
    const nextIndex = panelOrder.indexOf(panel);

    setPanelDirection(nextIndex > currentIndex ? 1 : -1);
    setActivePanel(panel);
  };

  const handleSubmit = async () => {
    if (!authUser?.id) return;

    const mentionPayload = getPayload();
    const payload: IPostCreateInput = {
      authorId: authUser.id,
      type: EPostType.text,
      content: mentionPayload.content,
      mentions: mentionPayload.mentions,
      location: selectedLocation ?? undefined,
      visibility: selectedVisibility,
    };
    console.log(payload);
  };

  return (
    <Modal
      open={opened}
      width={720}
      closable={false}
      onCancel={onCloseModal}
      footer={null}
      maskClosable={false}
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
                selectedVisibility={selectedVisibility}
                editorValue={editorValue}
                editorDoc={editorDoc}
                handleChange={handleChange}
                appendEmoji={appendEmoji}
                onSubmit={handleSubmit}
                onCloseModal={onCloseModal}
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
                onSelect={setSelectedVisibility}
                onBack={() => onNavigatePanel("composer")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </Flex>
    </Modal>
  );
};

export default PostCreate;
