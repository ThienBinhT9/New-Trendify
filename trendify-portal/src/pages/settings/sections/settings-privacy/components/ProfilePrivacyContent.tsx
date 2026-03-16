import { Flex, message, Switch } from "antd";
import Text from "@/components/text/Text";
import { useAppDispatch, useAppSelector } from "@/stores";
import { EVisibility } from "@/interfaces/common.interface";
import { updateUserSettingsAction } from "@/stores/settings/actions";
import { updateUserSettings } from "@/stores/settings/slice";

const ProfilePrivacyContent = () => {
  const dispatch = useAppDispatch();
  const userSettings = useAppSelector((state) => state.settings.userSettings);

  const handleTogglePrivacy = async (checked: boolean) => {
    const newVisibility = checked ? EVisibility.private : EVisibility.public;
    const prevVisibility = userSettings?.profileVisibility;

    dispatch(updateUserSettings({ profileVisibility: newVisibility }));

    try {
      dispatch(updateUserSettingsAction({ profileVisibility: newVisibility }));
    } catch {
      dispatch(updateUserSettings({ profileVisibility: prevVisibility }));
      message.error("Cập nhật thất bại, vui lòng thử lại");
    }
  };

  return (
    <Flex vertical className="settings-privacy-profile">
      <Flex align="center" justify="space-between" className="settings-privacy-profile__row">
        <Text textType="R14" className="settings-privacy-profile__label">
          Trang cá nhân riêng tư
        </Text>
        <Switch
          checked={userSettings?.profileVisibility === EVisibility.private}
          onChange={handleTogglePrivacy}
          className="settings-privacy-profile__switch"
        />
      </Flex>
      <Text textType="R14" className="settings-privacy-profile__desc">
        Khi tài khoản của bạn ở chế độ riêng tư, chỉ người theo dõi mới có thể nhìn thấy và tương
        tác với thread của bạn. Thread trả lời của bạn sẽ hiển thị với người theo dõi và từng trang
        cá nhân mà bạn trả lời.
      </Text>
    </Flex>
  );
};

export default ProfilePrivacyContent;
