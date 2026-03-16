import { Flex } from "antd";
import { LoaderSpin } from "@/components/loader";
import LoadingBar, { LoadingBarRef } from "react-top-loading-bar";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import ROUTE_PATHS from "@/routes/path.route";
import { useAppDispatch } from "@/stores";
import { signupVerifyAction } from "@/stores/auth/actions";

import Text from "@/components/text/Text";

import "./Guest.scss";
import { IApiError } from "@/interfaces/api.interface";

enum EVerifyEmailStatus {
  LOADING = "loading",
  SUCCESS = "success",
  ERROR = "error",
}

const VerifyEmailCallback = () => {
  const loadingRef = useRef<LoadingBarRef>(null);

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [status, setStatus] = useState<EVerifyEmailStatus>(EVerifyEmailStatus.LOADING);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      navigate(ROUTE_PATHS.SIGN_IN, { replace: true });
      return;
    }

    const verifyEmail = async () => {
      try {
        loadingRef.current?.start();
        await dispatch(signupVerifyAction({ token })).unwrap();

        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStatus(EVerifyEmailStatus.SUCCESS);

        await new Promise((resolve) => setTimeout(resolve, 1500));
        loadingRef.current?.complete();

        setTimeout(() => navigate(ROUTE_PATHS.SIGN_UP_COMPLETE, { replace: true }), 500);
      } catch (error) {
        const apiError = error as IApiError;
        setErrorMessage(apiError.message);
        setStatus(EVerifyEmailStatus.ERROR);

        await new Promise((resolve) => setTimeout(resolve, 500));
        loadingRef.current?.complete();

        setTimeout(() => navigate(ROUTE_PATHS.SIGN_IN, { replace: true }), 2500);
      }
    };

    verifyEmail();
  }, [navigate, dispatch, searchParams]);

  return (
    <>
      <LoadingBar ref={loadingRef} color="var(--primary-color)" height={3} shadow />
      <Flex vertical justify="center" flex={1} className="guest-container">
        <Flex className="verify-email-callback">
          <Flex vertical align="center" justify="center" gap={16}>
            {status !== EVerifyEmailStatus.ERROR && <LoaderSpin size={48} />}
            {status === EVerifyEmailStatus.LOADING && (
              <Text textType="M14" className="verify-callback-text">
                We’re verifying your email address…
              </Text>
            )}
            {status === EVerifyEmailStatus.SUCCESS && (
              <Text textType="M14" className="verify-callback-text">
                Redirecting you to complete your sign-up…
              </Text>
            )}
            {status === EVerifyEmailStatus.ERROR && (
              <Text textType="M14" className="verify-callback-text">
                {`${errorMessage}. Redirecting to sign in…`}
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>
    </>
  );
};

export default VerifyEmailCallback;
