import "./Home.scss";
import HeaderContainer from "@/layouts/components/header/HeaderContainer";
import Text from "@/components/text/Text";
import ROUTE_PATHS from "@/routes/path.route";
import { useLocation, useNavigate } from "react-router-dom";
import { readHomeScrollTop, setHomeScrollPosition } from "./homeScrollStore";

const HeaderHome = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: <Text textType="SB14">Dành cho bạn</Text>, key: ROUTE_PATHS.HOME },
    { label: <Text textType="SB14">Đang theo dõi</Text>, key: ROUTE_PATHS.FOLLOWING },
  ];

  const handleTabChange = (key: string) => {
    const currentTab = location.pathname.startsWith(ROUTE_PATHS.FOLLOWING) ? "following" : "forYou";
    setHomeScrollPosition(currentTab, readHomeScrollTop());
    navigate(key);
  };

  return (
    <HeaderContainer
      className="header-home-container"
      tabs={tabs}
      activeKey={location.pathname}
      onTabChange={handleTabChange}
    ></HeaderContainer>
  );
};

export default HeaderHome;
