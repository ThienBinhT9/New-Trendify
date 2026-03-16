import { Flex, Image } from "antd";

import "./ProfileFriends.scss";
import Text from "@/components/text/Text";
import { IUserRelationship } from "@/stores/profile/constants";
import { useLocation, useNavigate } from "react-router-dom";
import ROUTE_PATHS, { SUB_PATH_PROFILE } from "@/routes/path.route";
import FollowStatusCard from "@/container/card/FollowStatusCard";
import { useAppSelector } from "@/stores";
import { getProfileTab } from "@/utils/common.util";
// import FollowStatusCard from "@/container/card/FollowStatusCard";

interface Props {
  relationship: IUserRelationship;
}

const FriendCard = (props: Props) => {
  const { relationship } = props;
  const location = useLocation();

  const navigate = useNavigate();

  const isOwnProfile = useAppSelector((state) => state.profile.isOwnProfile);
  const currentTab = getProfileTab(location.pathname);

  const getVariant = () => {
    if (currentTab === SUB_PATH_PROFILE.FOLLOWING) return "following-list";
    if (currentTab === SUB_PATH_PROFILE.FOLLOWERS && isOwnProfile) return "follower-list";
    return "following-list";
  };

  const handlePress = () => {
    navigate(ROUTE_PATHS.PROFILE(relationship.id));
  };

  return (
    <Flex className="friend-card" onClick={handlePress}>
      <Image
        preview={{ mask: null }}
        className="friend-card-avatar"
        src={relationship.profilePicture?.small}
      />
      <Flex flex={1} vertical gap={4}>
        <Text textType="SB16">{`${relationship?.firstName} ${relationship?.lastName}`}</Text>
        <Text textType="R14" className="friend-card-mutial">
          {`@${relationship?.username}`}
        </Text>
      </Flex>
      {relationship.viewerContext && (
        <Flex onClick={(e) => e.stopPropagation()}>
          <FollowStatusCard relationship={relationship} variant={getVariant()} />
        </Flex>
      )}
    </Flex>
  );
};

export default FriendCard;
