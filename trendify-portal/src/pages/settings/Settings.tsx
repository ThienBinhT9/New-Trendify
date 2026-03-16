import { Flex } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { SETTINGS_CONFIG } from "./settings.config";
import SettingsNav from "./components/SettingsNav";
import Button from "@/components/button/Button";
import Text from "@/components/text/Text";
import { ArrowIcon } from "@/assets/icons/Icon";
import "./Settings.scss";

const Settings = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const sectionKey = pathname.split("/").filter(Boolean)[1];
  const isIndex = !sectionKey;

  const activeSectionKey =
    SETTINGS_CONFIG.find((s) => s.key === sectionKey || s.items?.some((i) => i.key === sectionKey))
      ?.key ?? sectionKey;

  return (
    <Flex className="settings-page">
      {isIndex && (
        <Flex vertical className="settings-index-card">
          <Text textType="SB18" className="settings-page-title">
            Cài đặt
          </Text>
          <Flex vertical className="settings-index-list">
            {SETTINGS_CONFIG.map((s) => (
              <Button
                key={s.key}
                type="text"
                className="settings-item settings-item--index"
                onClick={() => navigate(s.path)}
              >
                <Flex align="center" gap={12}>
                  <span className="settings-item-icon">{s.icon}</span>
                  <Text textType="R14">{s.label}</Text>
                </Flex>
                <ArrowIcon className="settings-item-chevron" />
              </Button>
            ))}
          </Flex>
        </Flex>
      )}

      {!isIndex && (
        <Flex className="settings-two-col-card">
          <SettingsNav activeKey={activeSectionKey} />
          <div className="settings-col-divider" />
          <Flex vertical flex={2.5} className="settings-right-panel">
            <Outlet />
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default Settings;
