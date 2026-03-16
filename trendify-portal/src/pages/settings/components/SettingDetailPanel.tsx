import { Flex } from "antd";
import { useNavigate, useLocation } from "react-router-dom";

import "../Settings.scss";
import { SETTINGS_CONFIG } from "../settings.config";
import { ArrowIcon } from "@/assets/icons/Icon";
import ROUTE_PATHS from "@/routes/path.route";

import Text from "@/components/text/Text";
import Button from "@/components/button/Button";

const SettingsDetailPanel = () => {
  const { pathname } = useLocation();
  const key = pathname.split("/").filter(Boolean)[1];

  const navigate = useNavigate();

  const parentSection = SETTINGS_CONFIG.find((s) => s.items?.some((i) => i.key === key));
  const activeDetail = parentSection?.items?.find((i) => i.key === key);

  return (
    <Flex vertical className="settings-detail-panel">
      {/* Header */}
      <Flex align="center" className="settings-detail-header">
        <Button
          type="text"
          className="settings-detail-back-btn"
          icon={<ArrowIcon width={22} height={22} />}
          onClick={() => navigate(parentSection?.path ?? ROUTE_PATHS.SETTINGS)}
        />
        <Text textType="SB16" className="settings-detail-title">
          {activeDetail?.label ?? ""}
        </Text>
      </Flex>

      {/* Custom content placeholder */}
      {activeDetail?.content ?? (
        <Flex className="settings-detail-placeholder">
          <Text textType="R14" style={{ opacity: 0.4 }}>
            Nội dung đang phát triển…
          </Text>
        </Flex>
      )}
    </Flex>
  );
};

export default SettingsDetailPanel;
