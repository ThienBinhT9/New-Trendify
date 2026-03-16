import { Form, Input as AntInput, App } from "antd";
import { useEffect, useMemo, useState } from "react";

import { profileRules } from "@/utils/rules.util";
import { EProfileActions } from "@/stores/profile/constants";
import { updateProfileAction } from "@/stores/profile/actions";
import { useAppDispatch, useAppSelector } from "@/stores";

import Text from "@/components/text/Text";
import Button from "@/components/button/Button";

const { TextArea } = AntInput;

interface IIntroTabProps {
  onDirtyChange: (dirty: boolean) => void;
}

const IntroTab = ({ onDirtyChange }: IIntroTabProps) => {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const { profile, isOwnProfile } = useAppSelector((state) => state.profile);
  const isUpdateLoading = useAppSelector((state) => state.loading[EProfileActions.MY_PROFILE]);

  const [initialAbout, setInitialAbout] = useState("");
  const currentValues = Form.useWatch([], form);

  const hasChanged = useMemo(() => {
    if (!isOwnProfile) return false;
    return (currentValues?.about || "") !== initialAbout;
  }, [currentValues, initialAbout, isOwnProfile]);

  const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);

  const handleSave = (values: { about: string }) => {
    dispatch(updateProfileAction({ about: values.about }))
      .unwrap()
      .then(() => {
        setInitialAbout(values.about);
        message.success("Lưu thông tin thành công!");
      })
      .catch(() => {
        message.error("Lưu thông tin thất bại, vui lòng thử lại.");
      });
  };

  useEffect(() => {
    const about = profile?.about || "";
    form.setFieldsValue({ about });
    setInitialAbout(about);
  }, [profile, form]);

  useEffect(() => {
    onDirtyChange(hasChanged);
  }, [hasChanged, onDirtyChange]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanged) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanged]);

  return (
    <>
      <div className="introduce-tab-content">
        <Text textType="SB16" className="tab-title">
          Giới thiệu
        </Text>

        {isOwnProfile ? (
          <Form form={form} layout="vertical" onFinish={handleSave}>
            <Form.Item
              name="about"
              label={<Text textType="M14">Mô tả về bạn</Text>}
              rules={profileRules.about}
            >
              <TextArea
                placeholder="Nêu suy nghĩ của bạn..."
                autoSize={{ minRows: 4, maxRows: 8 }}
                maxLength={500}
                showCount
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isUpdateLoading}
                disabled={!hasChanged || hasErrors}
                className="save-btn"
              >
                Lưu thay đổi
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <div className="about-display">
            <Text textType="R14">{profile?.about || "Chưa có thông tin giới thiệu."}</Text>
          </div>
        )}
      </div>
    </>
  );
};

export default IntroTab;
