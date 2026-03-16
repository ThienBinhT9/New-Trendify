import { Flex } from "antd";

import { EVisibility } from "@/interfaces/common.interface";

import Button from "@/components/button/Button";
import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";

interface IProps {
  visibility: EVisibility;
  onBack: () => void;
  onSelect: (value: EVisibility) => void;
}

const privacyOptions = [
  {
    value: EVisibility.public,
    title: "Công khai",
    description: "Bất kỳ ai trên Trendify",
    iconName: "GlobalIcon",
  },
  {
    value: EVisibility.private,
    title: "Chỉ mình tôi",
    description: "",
    iconName: "LockAltIcon",
  },
] as const;

const PrivacyPanel = ({ visibility, onBack, onSelect }: IProps) => {
  return (
    <Flex vertical className="post-modal-panel post-privacy-panel">
      <Flex className="post-modal-header">
        <Button
          type="text"
          className="post-icon-btn"
          icon={<Icon name="ArrowIcon" size={28} />}
          onClick={onBack}
        />
        <Text textType="SB22">Quyền riêng tư</Text>
        <span className="post-head-placeholder" />
      </Flex>

      <Flex vertical className="post-privacy-body">
        <Text textType="SB18">Ai có thể thấy bài đăng của bạn?</Text>
        <Text textType="R16" className="post-privacy-description">
          Bài đăng của bạn có thể xuất hiện trên News Feed, hồ sơ của bạn, trong kết quả tìm kiếm và
          trong Messenger.
        </Text>

        <Flex vertical className="post-privacy-options">
          {privacyOptions.map((option) => {
            const isActive = visibility === option.value;

            return (
              <Button
                key={option.value}
                type="text"
                className={`post-privacy-option ${isActive ? "active" : ""}`}
                onClick={() => onSelect(option.value)}
              >
                <Flex className="post-privacy-option-main">
                  <Flex className="post-privacy-icon-wrap">
                    <Icon name={option.iconName} size={18} />
                  </Flex>
                  <Flex vertical className="post-privacy-copy">
                    <Text textType="SB16">{option.title}</Text>
                    {option.description ? <Text textType="R14">{option.description}</Text> : null}
                  </Flex>
                </Flex>

                <span className={`post-privacy-radio ${isActive ? "active" : ""}`}>
                  <span className="post-privacy-radio-dot" />
                </span>
              </Button>
            );
          })}
        </Flex>
      </Flex>
    </Flex>
  );
};

export default PrivacyPanel;
