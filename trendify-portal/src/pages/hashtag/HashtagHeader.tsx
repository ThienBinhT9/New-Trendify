import { useParams } from "react-router-dom";

import HeaderContainer from "@/layouts/components/header/HeaderContainer";
import Text from "@/components/text/Text";
import "./HashtagPage.scss";

const HashtagHeader = () => {
  const { tag } = useParams<{ tag: string }>();

  return (
    <HeaderContainer
      className="header-hashtag"
      tabs={[
        {
          label: <Text textType="SB14">{`#${tag ?? ""}`}</Text>,
          key: "hashtag",
        },
      ]}
      activeKey="hashtag"
      onTabChange={() => {}}
    />
  );
};

export default HashtagHeader;
