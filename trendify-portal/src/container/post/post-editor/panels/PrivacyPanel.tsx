import { Flex, Switch } from "antd";

import { EVisibility } from "@/interfaces/common.interface";

import Button from "@/components/button/Button";
import Icon from "@/components/icon/Icon";
import Text from "@/components/text/Text";

interface IProps {
  visibility: EVisibility;
  canLike: boolean;
  canComment: boolean;
  canSave: boolean;
  canShare: boolean;
  onBack: () => void;
  onSelect: (value: EVisibility) => void;
  onTogglePermission: (
    key: "canLike" | "canComment" | "canSave" | "canShare",
    value: boolean,
  ) => void;
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

const interactionOptions = [
  {
    key: "canLike",
    title: "Cho phép thích",
    description: "Mọi người có thể thả tim bài viết của bạn",
  },
  {
    key: "canComment",
    title: "Cho phép bình luận",
    description: "Mọi người có thể bình luận bài viết của bạn",
  },
  {
    key: "canSave",
    title: "Cho phép lưu",
    description: "Mọi người có thể lưu bài viết này",
  },
  {
    key: "canShare",
    title: "Cho phép chia sẻ",
    description: "Mọi người có thể chia sẻ bài viết này",
  },
] as const;

const PrivacyPanel = ({
  visibility,
  canLike,
  canComment,
  canSave,
  canShare,
  onBack,
  onSelect,
  onTogglePermission,
}: IProps) => {
  const permissions = { canLike, canComment, canSave, canShare };

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

        <Flex vertical className="post-privacy-permissions">
          <Text textType="SB18">Ai có thể tương tác với bài đăng?</Text>

          <Flex vertical className="post-privacy-permissions-list">
            {interactionOptions.map((option) => (
              <Flex key={option.key} className="post-privacy-permission-item">
                <Flex vertical className="post-privacy-permission-copy">
                  <Text textType="SB16">{option.title}</Text>
                  <Text textType="R14">{option.description}</Text>
                </Flex>
                <Switch
                  checked={permissions[option.key]}
                  onChange={(checked) => onTogglePermission(option.key, checked)}
                />
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default PrivacyPanel;
