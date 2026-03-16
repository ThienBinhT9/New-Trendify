import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import ROUTE_PATHS from "@/routes/path.route";
import { useAppSelector } from "@/stores";
import { LogoIcon } from "@/assets/images";

import SplashScreen from "../splash/Splash";

const Private = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const navigate = useNavigate();

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTE_PATHS.SIGN_IN, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  return showSplash ? (
    <SplashScreen logo={LogoIcon} onFinish={() => setShowSplash(false)} />
  ) : (
    <Outlet />
  );
};

export default Private;
