import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Flex, Form } from "antd";

import "./Guest.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { IApiError } from "@/interfaces/api.interface";
import { resetRules } from "@/utils/rules.util";
import { EAuthActions } from "@/stores/auth/constants";
import { resetPasswordAction } from "@/stores/auth/actions";
import { useAppDispatch, useAppSelector } from "@/stores";

import Text from "@/components/text/Text";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";
import { EVerifyEmailType } from "@/interfaces/auth.interface";

const ResetPassword = () => {
  const loading = useAppSelector((state) => state.loading);

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleResetPassword = async () => {
    const body = form.getFieldsValue();

    try {
      await dispatch(
        resetPasswordAction({ newPassword: body.password, token: searchParams.get("token") || "" }),
      ).unwrap();

      navigate(ROUTE_PATHS.SIGN_IN, { replace: true });
    } catch (error) {
      const apiError = error as IApiError;
      setErrorMessage(apiError.message);
    }
  };

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate(`${ROUTE_PATHS.REQUEST_EMAIL_VERIFICATION}?type=${EVerifyEmailType.FORGOT}`, {
        replace: true,
      });
      return;
    }
  }, [navigate, searchParams]);

  return (
    <Flex vertical justify="center" flex={1} className="guest-container">
      <Form layout="vertical" form={form} requiredMark={false} onFinish={handleResetPassword}>
        <Text textType="M24" className="guest-container-title">
          Reset Password
        </Text>

        <Form.Item name="password" label="New Password" rules={resetRules.password}>
          <Input.Password placeholder="Enter your new password" />
        </Form.Item>
        <Form.Item
          dependencies={["password"]}
          name="confirm_password"
          label="Password Confirmation"
          rules={resetRules.confirmPassword(form.getFieldValue)}
        >
          <Input.Password placeholder="Enter your confirm password" />
        </Form.Item>

        {errorMessage && (
          <Flex align="center" justify="center">
            <Text textType="M12" style={{ color: "var(--color-error)" }}>
              {errorMessage}
            </Text>
          </Flex>
        )}

        <Flex vertical gap={12} className="mt-32">
          <Button
            type="primary"
            htmlType="submit"
            className="guest-btn"
            loading={loading[EAuthActions.RESET_PASSWORD]}
          >
            <Text textType="M14">Confirm</Text>
          </Button>
          <Button
            className="guest-btn"
            loading={loading[EAuthActions.RESET_PASSWORD]}
            onClick={() =>
              navigate(
                `${ROUTE_PATHS.REQUEST_EMAIL_VERIFICATION}?type=${EVerifyEmailType.FORGOT}`,
                { replace: true },
              )
            }
          >
            <Text textType="M14">Back</Text>
          </Button>
        </Flex>
      </Form>
    </Flex>
  );
};

export default ResetPassword;
