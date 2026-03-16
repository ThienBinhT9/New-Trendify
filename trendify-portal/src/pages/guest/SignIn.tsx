import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flex, Form, Divider } from "antd";

import "./Guest.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { IApiError } from "@/interfaces/api.interface";
import { EAuthActions } from "@/stores/auth/constants";
import { signinAction } from "@/stores/auth/actions";
import { useAppDispatch, useAppSelector } from "@/stores";
import { GoogleIcon, AppleIcon, EmailIcon, LockIcon } from "@/assets/icons/Icon";

import Text from "@/components/text/Text";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";

const SignIn = () => {
  const loading = useAppSelector((state) => state.loading);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form] = Form.useForm();
  const [errorMessage, setErrorMessage] = useState<string>("");

  const email = Form.useWatch("email", form);
  const password = Form.useWatch("password", form);

  const handleLogin = async () => {
    setErrorMessage("");

    try {
      await dispatch(signinAction({ email, password })).unwrap();
      navigate(ROUTE_PATHS.HOME);
    } catch (error) {
      const apiError = error as IApiError;
      setErrorMessage(apiError.message);
    }
  };

  const handleEmailEnter = () => {
    if (!email) return;

    if (!password) {
      const inputPassword = document.getElementById("password") as HTMLInputElement | null;
      inputPassword?.focus();
    } else {
      handleLogin();
    }
  };

  const handlePasswordEnter = () => {
    if (email && password) handleLogin();
  };

  const handleValuesChange = () => {
    setErrorMessage("");
  };

  const isDisabled = !email || !password;

  return (
    <Flex vertical justify="center" flex={1} className="guest-container">
      <Form layout="vertical" form={form} onValuesChange={handleValuesChange}>
        <Text textType="M24" className="guest-container-title">
          Sign In
        </Text>
        <Form.Item name="email" label="Email">
          <Input
            placeholder="Enter your email"
            prefix={<EmailIcon width={18} height={18} />}
            onPressEnter={handleEmailEnter}
          />
        </Form.Item>
        <Form.Item name="password" label="Password">
          <Input.Password
            placeholder="Enter your password"
            prefix={<LockIcon width={18} height={18} />}
            onPressEnter={handlePasswordEnter}
          />
        </Form.Item>
        <Flex justify="end">
          <Text
            textType="M12"
            className="sign-in-forgot-password"
            onClick={() => navigate(`${ROUTE_PATHS.REQUEST_EMAIL_VERIFICATION}?type=forgot`)}
          >
            Forgot Password?
          </Text>
        </Flex>
        {errorMessage && (
          <Flex align="center" justify="center" className="mb-16">
            <Text textType="M12" style={{ color: "var(--color-error)" }}>
              {errorMessage}
            </Text>
          </Flex>
        )}
        <Button
          className="guest-btn"
          type="primary"
          htmlType="submit"
          disabled={isDisabled}
          loading={loading[EAuthActions.SIGN_IN]}
          onClick={handleLogin}
        >
          <Text textType="M14">Sign In</Text>
        </Button>
        <Divider>
          <Text>Or</Text>
        </Divider>
        <Flex vertical gap={12}>
          <Button className="guest-btn btn-transparent" icon={<GoogleIcon />}>
            <Text textType="M12">Continue with Google</Text>
          </Button>
          <Button
            className="guest-btn btn-transparent"
            icon={<AppleIcon style={{ width: 24, height: 24 }} />}
          >
            <Text textType="M12">Continue with Apple</Text>
          </Button>
        </Flex>
      </Form>
    </Flex>
  );
};

export default SignIn;
