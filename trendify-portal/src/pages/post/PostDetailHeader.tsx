import HeaderContainer from "@/layouts/components/header/HeaderContainer";
import "./PostDetailPage.scss";

const PostDetailHeader = () => {
  return (
    <HeaderContainer
      className="header-post-detail"
      tabs={[]}
      activeKey={""}
      onTabChange={() => {}}
      showTabs={false}
    ></HeaderContainer>
  );
};

export default PostDetailHeader;
