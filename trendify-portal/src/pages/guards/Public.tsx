import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import ROUTE_PATHS from "@/routes/path.route";
import { useAppSelector } from "@/stores";

const Public = () => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTE_PATHS.HOME, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }

  return <Outlet />;
};

export default Public;
