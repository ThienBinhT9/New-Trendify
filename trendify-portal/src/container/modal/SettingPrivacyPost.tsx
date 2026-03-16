import Modal from "@/components/modal/Modal";
import FooterModal from "@/components/modal/FooterModal";
import { Flex, Radio, RadioChangeEvent } from "antd";
import Text from "@/components/text/Text";
import { useState } from "react";
import Icon from "@/components/icon/Icon";
import { EVisibility } from "@/interfaces/common.interface";

interface Props {
  open: boolean;
  visibility: EVisibility;
  onCancel: () => void;
}

const ModalSettingPrivacyPost = (props: Props) => {
  const { open, visibility, onCancel } = props;

  const [value, setValue] = useState<EVisibility>(visibility);
  const [loading, setLoading] = useState<boolean>(false);

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await new Promise((resolve) => setTimeout(() => resolve([]), 2000));

      onCancel();
    } catch (error) {
      console.log("set post's privacy error: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      className="modal-setting-privacy-post"
      footer={<FooterModal loading={loading} onCancel={onCancel} onSubmit={handleSubmit} />}
    >
      <Flex gap={6} vertical className="p-16">
        <Text textType="SB16">Who can see your post?</Text>
        <Text textType="R14">
          Your post may appear on News Feed, your profile, in search results, and in Messenger.
        </Text>
        <Flex gap={12} vertical className="mt-8">
          <Radio.Group
            value={value}
            className="radio-reverse"
            onChange={onChange}
            options={[
              {
                value: EVisibility.public,
                label: (
                  <Flex className="radio-item">
                    <Flex className="radio-icon">
                      <Icon name="GlobalIcon" size={20} />
                    </Flex>
                    <Flex vertical>
                      <Text textType="M14">Public</Text>
                      <Text textType="R12">Anyone on or off Trendify</Text>
                    </Flex>
                  </Flex>
                ),
              },
              {
                value: EVisibility.private,
                label: (
                  <Flex className="radio-item">
                    <Flex className="radio-icon">
                      <Icon name="LockAltIcon" />
                    </Flex>
                    <Text textType="M14">Only me</Text>
                  </Flex>
                ),
              },
            ]}
          />
        </Flex>
      </Flex>
    </Modal>
  );
};

export default ModalSettingPrivacyPost;
