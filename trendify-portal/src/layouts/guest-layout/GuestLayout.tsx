import { Flex } from "antd";
import { useNavigate } from "react-router-dom";

import "./GuestLayout.scss";
import BG_IMAGE from "@/assets/images/backgroud-guest.jpg";
import LOGO_ICON from "@/assets/images/icon-logo.png";
import ROUTE_PATHS from "@/routes/path.route";
import { EVerifyEmailType } from "@/interfaces/auth.interface";

import Text from "@/components/text/Text";
import Button from "@/components/button/Button";

const GuestLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const pathName = window.location.pathname;
  const search = window.location.search;

  return (
    <Flex vertical className="guest-layout-container">
      <Flex align="center" justify="space-between" className="guest-layout-header">
        <Flex gap={4} align="center">
          <img
            src={LOGO_ICON}
            style={{ width: 32, height: 32, cursor: "pointer" }}
            onClick={() => navigate(ROUTE_PATHS.SIGN_IN)}
          />
        </Flex>
        <Flex gap={12}>
          <Button
            type={pathName === ROUTE_PATHS.SIGN_IN ? "primary" : "default"}
            onClick={() => navigate(ROUTE_PATHS.SIGN_IN, { replace: true })}
          >
            <Text textType="M14">Sign In</Text>
          </Button>
          <Button
            type={
              ROUTE_PATHS.SIGN_UP_COMPLETE === pathName ||
              `${ROUTE_PATHS.REQUEST_EMAIL_VERIFICATION}?type=${EVerifyEmailType.CREATE}` ===
                pathName + search
                ? "primary"
                : "default"
            }
            onClick={() =>
              navigate(`${ROUTE_PATHS.REQUEST_EMAIL_VERIFICATION}?type=${EVerifyEmailType.CREATE}`)
            }
          >
            <Text textType="M14">Sign Up</Text>
          </Button>
        </Flex>
      </Flex>
      <Flex
        flex={1}
        align="center"
        justify="center"
        className="guest-layout-content"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      >
        <Flex className="guest-layout-section">{children}</Flex>
      </Flex>
    </Flex>
  );
};

export default GuestLayout;
