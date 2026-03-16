import { Flex, Modal, Tabs, TabsProps } from "antd";
import "./ProfileIntroduce.scss";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import ROUTE_PATHS, { SUB_PATH_PROFILE } from "@/routes/path.route";
import Text from "@/components/text/Text";
import Button from "@/components/button/Button";
import IntroTab from "./components/Intro";
import PersonalInfoTab from "./components/PersonalInfo";

const ProfileIntroduce = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { id: userId } = useParams();

  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [pendingTab, setPendingTab] = useState<string | null>(null);

  const activeKey = location.pathname.includes(SUB_PATH_PROFILE.PERSONAL_DETAIL)
    ? SUB_PATH_PROFILE.PERSONAL_DETAIL
    : SUB_PATH_PROFILE.INTRODUCE;

  const introduce_tabs: TabsProps["items"] = [
    {
      key: SUB_PATH_PROFILE.INTRODUCE,
      label: <Text textType="M14">Giới thiệu</Text>,
      children: <IntroTab onDirtyChange={setIsDirty} />,
    },
    {
      key: SUB_PATH_PROFILE.PERSONAL_DETAIL,
      label: <Text textType="M14">Thông tin cá nhân</Text>,
      children: <PersonalInfoTab onDirtyChange={setIsDirty} />,
    },
  ];

  const handleChangeTab = (tab: string) => {
    if (isDirty) {
      setPendingTab(tab);
    } else {
      navigate(`${ROUTE_PATHS.PROFILE(userId)}${tab}`);
    }
  };

  const handleConfirmLeave = () => {
    setIsDirty(false);
    if (pendingTab) {
      navigate(`${ROUTE_PATHS.PROFILE(userId)}${pendingTab}`);
    }
    setPendingTab(null);
  };

  const handleCancelLeave = () => {
    setPendingTab(null);
  };

  return (
    <Flex className="profile-introduce-container">
      <Modal
        open={!!pendingTab}
        centered
        title="Rời khỏi trang?"
        onCancel={handleCancelLeave}
        footer={[
          <Button key="stay" onClick={handleCancelLeave}>
            <Text textType="M14">Ở lại trang</Text>
          </Button>,
          <Button key="leave" type="primary" onClick={handleConfirmLeave}>
            <Text textType="M14">Rời khỏi trang</Text>
          </Button>,
        ]}
      >
        <Text textType="R14">
          Bạn có chắc chắn muốn rời khỏi trang? Những thay đổi chưa được lưu sẽ bị mất.
        </Text>
      </Modal>
      <Tabs
        destroyInactiveTabPane
        tabPosition={"left"}
        items={introduce_tabs}
        activeKey={activeKey}
        onChange={handleChangeTab}
        className="introduce-tabs"
      />
    </Flex>
  );
};

export default ProfileIntroduce;
