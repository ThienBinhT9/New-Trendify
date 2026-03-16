import { Flex } from "antd";
import { useNavigate } from "react-router-dom";
import { SETTINGS_CONFIG } from "../settings.config";
import Button from "@/components/button/Button";
import Text from "@/components/text/Text";
import "../Settings.scss";

interface SettingsNavProps {
  activeKey?: string;
}

const SettingsNav = ({ activeKey }: SettingsNavProps) => {
  const navigate = useNavigate();

  return (
    <Flex vertical className="settings-nav">
      {SETTINGS_CONFIG.map((s) => (
        <Button
          key={s.key}
          type="text"
          className={`settings-nav-item ${s.key === activeKey ? "settings-nav-item--active" : ""}`}
          onClick={() => navigate(s.path)}
        >
          <span className="settings-item-icon">{s.icon}</span>
          <Text textType="R14">{s.label}</Text>
        </Button>
      ))}
    </Flex>
  );
};

export default SettingsNav;
