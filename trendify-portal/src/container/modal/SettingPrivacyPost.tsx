import Modal from "@/components/modal/Modal";
import FooterModal from "@/components/modal/FooterModal";
import { App, Flex, Radio, RadioChangeEvent } from "antd";
import Text from "@/components/text/Text";
import { useEffect, useState } from "react";
import Icon from "@/components/icon/Icon";
import { EVisibility } from "@/interfaces/common.interface";
import { useAppDispatch } from "@/stores";
import { updatePostAction } from "@/stores/post/actions";

interface Props {
  open: boolean;
  postId: string;
  visibility: EVisibility;
  onCancel: () => void;
  onSaved?: (newVisibility: EVisibility) => void;
}

const ModalSettingPrivacyPost = (props: Props) => {
  const { open, postId, visibility, onCancel, onSaved } = props;
  const { message } = App.useApp();
  const dispatch = useAppDispatch();

  const [value, setValue] = useState<EVisibility>(visibility);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (open) {
      setValue(visibility);
    }
  }, [open, visibility]);

  const onChange = (e: RadioChangeEvent) => {
    setValue(e.target.value);
  };

  const handleSubmit = async () => {
    if (value === visibility) {
      onCancel();
      return;
    }

    try {
      setLoading(true);
      await dispatch(updatePostAction({ postId, visibility: value })).unwrap();
      onSaved?.(value);
      onCancel();
    } catch (error) {
      console.log("set post's privacy error: ", error);
      message.error("Cập nhật quyền riêng tư thất bại, vui lòng thử lại.");
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

