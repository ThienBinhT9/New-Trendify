import { Flex } from "antd";
import { useNavigate } from "react-router-dom";

import "../Settings.scss";
import { SETTINGS_CONFIG } from "../settings.config";
import { ArrowIcon } from "@/assets/icons/Icon";

import Button from "@/components/button/Button";
import Text from "@/components/text/Text";

interface Props {
  sectionKey: string;
}

const SettingsSectionPanel = ({ sectionKey }: Props) => {
  const navigate = useNavigate();

  const activeSection = SETTINGS_CONFIG.find((s) => s.key === sectionKey);

  if (!activeSection?.items) return null;

  return (
    <Flex vertical className="settings-section-panel">
      {activeSection.items.map((item) => (
        <Button
          key={item.key}
          type="text"
          className="settings-item"
          onClick={() => item.path && navigate(item.path)}
        >
          <Flex align="center" gap={10}>
            {item.icon && <span className="settings-item-icon">{item.icon}</span>}
            <Text textType="M14">{item.label}</Text>
          </Flex>
          <Flex align="center" gap={6} className="settings-item-right">
            {item.path && <ArrowIcon className="settings-item-chevron" />}
          </Flex>
        </Button>
      ))}
    </Flex>
  );
};

export default SettingsSectionPanel;
