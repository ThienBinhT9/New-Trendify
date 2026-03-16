import { Flex, Form } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import "./Guest.scss";
import ROUTE_PATHS from "@/routes/path.route";
import { EmailIcon } from "@/assets/icons/Icon";
import { IApiError } from "@/interfaces/api.interface";
import { emailRules } from "@/utils/rules.util";
import { EAuthActions } from "@/stores/auth/constants";
import { ESignupStep, EVerifyEmailType } from "@/interfaces/auth.interface";
import { useAppDispatch, useAppSelector } from "@/stores";
import { forgotPasswordAction, signupStartAction } from "@/stores/auth/actions";

import Text from "@/components/text/Text";
import Input from "@/components/input/Input";
import Button from "@/components/button/Button";

const INITIAL_COOLDOWN = 120 * 1000; // 120s
const title = {
  [EVerifyEmailType.CREATE]: {
    title: "Sign Up",
    subTitle: "Create an account and enjoy all the services we offer.",
  },
  [EVerifyEmailType.FORGOT]: {
    title: "Forgot Password?",
    subTitle: "Enter your registered email to proceed with the password recovery process.",
  },
};

const RequestEmailVerification = () => {
  const loading = useAppSelector((state) => state.loading);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form] = Form.useForm();
  const [searchParams] = useSearchParams();

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSuccessScreen, setIsSuccessScreen] = useState<boolean>(false);

  const type = searchParams.get("type") as EVerifyEmailType;

  const handleSendEmail = async () => {
    const email = form.getFieldValue("email");
    setErrorMessage("");

    try {
      if (type === EVerifyEmailType.CREATE) {
        const response = await dispatch(signupStartAction({ email })).unwrap();

        const nextStep = response.data.data.nextStep;
        if (nextStep === ESignupStep.COMPLETE_SIGNUP) {
          navigate(ROUTE_PATHS.SIGN_UP_COMPLETE, { replace: true });
        }
        setIsSuccessScreen(true);
      } else {
        await dispatch(forgotPasswordAction({ email })).unwrap();
        setIsSuccessScreen(true);
      }
    } catch (error) {
      const apiError = error as IApiError;
      setErrorMessage(apiError.message);
    }
  };

  const handleGoBack = () => {
    navigate(ROUTE_PATHS.SIGN_IN, { replace: true });
  };

  const handleValuesChange = () => {
    setErrorMessage("");
  };

  useEffect(() => {
    if (![EVerifyEmailType.CREATE, EVerifyEmailType.FORGOT].includes(type)) {
      navigate(ROUTE_PATHS.SIGN_IN, { replace: true });
    }
  }, [type, navigate]);

  if (isSuccessScreen) {
    return (
      <VerifyEmailSent
        email={form.getFieldValue("email") || ""}
        type={type}
        setIsSuccessScreen={setIsSuccessScreen}
      />
    );
  }

  return (
    <Flex vertical justify="center" flex={1} className="guest-container">
      <Form
        layout="vertical"
        validateTrigger={["onBlur", "onSubmit"]}
        form={form}
        requiredMark={false}
        onFinish={handleSendEmail}
        onValuesChange={handleValuesChange}
      >
        <Text textType="M24" className="guest-container-title">
          {title?.[type]?.title}
        </Text>
        <Text textType="R16" className="guest-container-subtitle">
          {title?.[type]?.subTitle}
        </Text>
        <Form.Item name="email" label="Email" rules={emailRules}>
          <Input
            placeholder="Enter your email"
            prefix={<EmailIcon />}
            onPressEnter={(e) => {
              e.preventDefault();
              form.submit();
            }}
          />
        </Form.Item>
        {errorMessage && (
          <Flex align="center" justify="center" className="mb-16">
            <Text textType="M12" style={{ color: "var(--color-error)" }}>
              {errorMessage}
            </Text>
          </Flex>
        )}
        <Button
          htmlType="submit"
          type="primary"
          loading={
            loading[
              type === EVerifyEmailType.CREATE
                ? EAuthActions.SIGN_UP_START
                : EAuthActions.FORGOT_PASSWORD
            ]
          }
          className="guest-btn mt-16"
        >
          <Text textType="M14">Confirm</Text>
        </Button>
        <Flex className="mt-16">
          {type === EVerifyEmailType.CREATE ? (
            <Flex gap={4} align="center" justify="center" flex={1}>
              <Text>Already have an account?</Text>
              <Text textType="M14" className="pointer guest-already" onClick={handleGoBack}>
                Sign in
              </Text>
            </Flex>
          ) : (
            <Button className="guest-btn btn-transparent" onClick={handleGoBack}>
              <Text textType="M14">Back</Text>
            </Button>
          )}
        </Flex>
      </Form>
    </Flex>
  );
};

const VerifyEmailSent = (props: {
  email: string;
  type: EVerifyEmailType;
  setIsSuccessScreen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { email, type, setIsSuccessScreen } = props;

  const loading = useAppSelector((state) => state.loading);

  const dispatch = useAppDispatch();

  const [now, setNow] = useState(Date.now());
  const [endTime, setEndTime] = useState<number>(Date.now() + INITIAL_COOLDOWN);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleResendEmail = async () => {
    try {
      setErrorMessage("");

      if (type === EVerifyEmailType.CREATE) {
        await dispatch(signupStartAction({ email })).unwrap();
      } else {
        await dispatch(forgotPasswordAction({ email })).unwrap();
      }
      setEndTime(Date.now() + INITIAL_COOLDOWN);

      //show toast
    } catch (error) {
      const apiError = error as IApiError;
      setErrorMessage(apiError.message);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const remaining = endTime ? Math.max(0, Math.ceil((endTime - now) / 1000)) : 0;

  return (
    <Flex vertical gap={16} className="guest-container">
      <Text textType="M24">Check Your Email</Text>

      <div>
        <Text textType="R16">We’ve sent a verification link to</Text>
        <Text textType="SB16">{email}</Text>
      </div>

      <Text textType="R16">Open your email and click the link to continue.</Text>
      {errorMessage && (
        <Flex align="center" justify="center">
          <Text textType="M12" style={{ color: "var(--color-error)" }}>
            {errorMessage}
          </Text>
        </Flex>
      )}
      <Flex vertical gap={8} className="mt-16">
        <Button
          className="guest-btn"
          type="primary"
          disabled={remaining > 0}
          loading={
            loading[
              type === EVerifyEmailType.CREATE
                ? EAuthActions.SIGN_UP_START
                : EAuthActions.FORGOT_PASSWORD
            ]
          }
          onClick={handleResendEmail}
        >
          <Text textType="M14">{`Resend email ${remaining > 0 ? ` (${remaining})` : ""}`}</Text>
        </Button>
        <Button className="guest-btn" type="primary" onClick={() => setIsSuccessScreen(false)}>
          <Text textType="M14">Back</Text>
        </Button>
      </Flex>
    </Flex>
  );
};

export default RequestEmailVerification;
