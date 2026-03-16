import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Flex, Form } from "antd";

import "./Guest.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { IApiError } from "@/interfaces/api.interface";
import { signupRules } from "@/utils/rules.util";
import { EAuthActions } from "@/stores/auth/constants";
import { signupCompleteAction } from "@/stores/auth/actions";
import { useAppDispatch, useAppSelector } from "@/stores";

import Text from "@/components/text/Text";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";

const SignUp = () => {
  const loading = useAppSelector((state) => state.loading);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSignUp = async () => {
    const body = form.getFieldsValue();

    try {
      await dispatch(signupCompleteAction({ ...body, firstName: "ABC" })).unwrap();
      navigate(ROUTE_PATHS.HOME, { replace: true });
    } catch (error) {
      const apiError = error as IApiError;
      setErrorMessage(apiError.message);
    }
  };

  return (
    <Flex vertical justify="center" flex={1} className="guest-container">
      <Form layout="vertical" form={form} requiredMark={false} onFinish={handleSignUp}>
        <Text textType="M24" className="guest-container-title">
          Sign Up
        </Text>
        <Form.Item name="username" label="Username" rules={signupRules.username}>
          <Input placeholder="Enter your username" />
        </Form.Item>
        <Form.Item name="password" label="Password" rules={signupRules.password}>
          <Input.Password placeholder="Enter your password" />
        </Form.Item>
        <Form.Item
          dependencies={["password"]}
          name="confirm_password"
          label="Password Confirmation"
          rules={signupRules.confirmPassword(form.getFieldValue)}
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

        <Button
          type="primary"
          htmlType="submit"
          className="guest-btn mt-16 mb-16"
          loading={loading[EAuthActions.SIGN_UP_COMPLETE]}
        >
          <Text textType="M14">Create Account</Text>
        </Button>
        <Flex gap={4} align="center" justify="center" flex={1}>
          <Text>Already have an account?</Text>
          <Text
            textType="M14"
            className="guest-already pointer"
            onClick={() => navigate(ROUTE_PATHS.SIGN_IN)}
          >
            Sign in
          </Text>
        </Flex>
      </Form>
    </Flex>
  );
};

export default SignUp;
