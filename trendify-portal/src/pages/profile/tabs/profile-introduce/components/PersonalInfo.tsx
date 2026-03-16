import { Form, Input as AntInput, Select, Flex, App } from "antd";
import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { useAppDispatch, useAppSelector } from "@/stores";
import { updateProfileAction } from "@/stores/profile/actions";
import { EProfileActions } from "@/stores/profile/constants";
import { EUserGender } from "@/interfaces/user.interface";
import { InputDate } from "@/components/input/Input";
import Button from "@/components/button/Button";
import Text from "@/components/text/Text";
import { profileRules } from "@/utils/rules.util";

const { TextArea } = AntInput;

interface IPersonalInfoForm {
  username: string;
  about: string;
  gender: EUserGender;
  dateOfBirth: dayjs.Dayjs | null;
}

const genderOptions = [
  { label: "Nam", value: EUserGender.MALE },
  { label: "Nữ", value: EUserGender.FEMALE },
  { label: "Khác", value: EUserGender.OTHER },
];

interface IPersonalInfoTabProps {
  onDirtyChange: (dirty: boolean) => void;
}

const PersonalInfoTab = ({ onDirtyChange }: IPersonalInfoTabProps) => {
  const [form] = Form.useForm<IPersonalInfoForm>();
  const dispatch = useAppDispatch();
  const { message } = App.useApp();
  const { profile, isOwnProfile } = useAppSelector((state) => state.profile);
  const isUpdateLoading = useAppSelector((state) => state.loading[EProfileActions.MY_PROFILE]);

  const [initialValues, setInitialValues] = useState<Partial<IPersonalInfoForm>>({});
  const currentValues = Form.useWatch([], form);

  const hasChanged = useMemo(() => {
    if (!isOwnProfile || !currentValues) return false;

    const aboutChanged =
      (currentValues.about?.trim() || "") !== (initialValues.about?.trim() || "");

    const genderChanged = currentValues.gender !== initialValues.gender;

    const dobChanged = (() => {
      const cur = currentValues.dateOfBirth as dayjs.Dayjs | null | undefined;
      const init = initialValues.dateOfBirth as dayjs.Dayjs | null | undefined;
      if (!cur && !init) return false;
      if (!cur || !init) return true;
      return !cur.isSame(init, "day");
    })();

    return aboutChanged || genderChanged || dobChanged;
  }, [currentValues, initialValues, isOwnProfile]);

  const handleSave = async (values: IPersonalInfoForm) => {
    dispatch(
      updateProfileAction({
        about: values.about,
        gender: values.gender,
        dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : undefined,
      }),
    )
      .unwrap()
      .then(() => {
        const saved: Partial<IPersonalInfoForm> = {
          username: values.username,
          about: values.about,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth,
        };
        setInitialValues(saved);
        message.success("Lưu thông tin thành công!");
      })
      .catch(() => {
        message.error("Lưu thông tin thất bại, vui lòng thử lại.");
      });
  };

  useEffect(() => {
    onDirtyChange(hasChanged);
  }, [hasChanged, onDirtyChange]);

  useEffect(() => {
    const initial: Partial<IPersonalInfoForm> = {
      username: profile?.username || "",
      about: profile?.about || "",
      gender: profile?.gender,
      dateOfBirth: profile?.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
    };

    form.setFieldsValue(initial);
    setInitialValues(initial);
  }, [profile, form]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasChanged) e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasChanged]);

  if (!isOwnProfile) {
    return (
      <div className="introduce-tab-content">
        <Text textType="SB16" className="tab-title">
          Thông tin cá nhân
        </Text>
        <Flex vertical gap={12}>
          <div className="info-row">
            <Text textType="SB14">Tên người dùng</Text>
            <Text textType="R14">{profile?.username || "—"}</Text>
          </div>
          <div className="info-row">
            <Text textType="SB14">Giới thiệu</Text>
            <Text textType="R14">{profile?.about || "—"}</Text>
          </div>
          <div className="info-row">
            <Text textType="SB14">Giới tính</Text>
            <Text textType="R14">
              {profile?.gender
                ? genderOptions.find((o) => o.value === profile.gender)?.label || "—"
                : "—"}
            </Text>
          </div>
          {profile?.dateOfBirth && (
            <div className="info-row">
              <Text textType="SB14">Ngày sinh</Text>
              <Text textType="R14">{dayjs(profile.dateOfBirth).format("DD/MM/YYYY")}</Text>
            </div>
          )}
        </Flex>
      </div>
    );
  }

  return (
    <div className="introduce-tab-content">
      <Text textType="SB16" className="tab-title">
        Thông tin cá nhân
      </Text>

      <Form form={form} layout="vertical" onFinish={handleSave}>
        <Form.Item name="username" label={<Text textType="M14">Tên người dùng</Text>}>
          <AntInput disabled placeholder="Tên người dùng" />
        </Form.Item>

        <Form.Item
          name="about"
          label={<Text textType="M14">Giới thiệu bản thân</Text>}
          rules={profileRules.about}
        >
          <TextArea
            placeholder="Nêu suy nghĩ của bạn..."
            autoSize={{ minRows: 4, maxRows: 8 }}
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item name="gender" label={<Text textType="M14">Giới tính</Text>}>
          <Select placeholder="Chọn giới tính" options={genderOptions} allowClear />
        </Form.Item>

        <Form.Item
          name="dateOfBirth"
          label={<Text textType="M14">Ngày sinh</Text>}
          rules={profileRules.dateOfBirth}
        >
          <InputDate placeholder="Chọn ngày sinh" format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={isUpdateLoading}
            disabled={!hasChanged}
            className="save-btn"
          >
            Lưu thay đổi
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default PersonalInfoTab;
