import { Avatar, Flex } from "antd";

import "./ProfileFriends.scss";
import Text from "@/components/text/Text";
import { IUserRelationship, IUserViewContext } from "@/stores/profile/constants";
import { useLocation, useNavigate } from "react-router-dom";
import ROUTE_PATHS, { SUB_PATH_PROFILE } from "@/routes/path.route";
import FollowStatusCard from "@/container/card/FollowStatusCard";
import { useAppSelector } from "@/stores";
import { getAvatarUrl, getProfileTab } from "@/utils/common.util";
// import FollowStatusCard from "@/container/card/FollowStatusCard";

interface Props {
  relationship: IUserRelationship;
  hideFollowAction?: boolean;
  className?: string;
  onFollowChange?: (newViewContext: Partial<IUserViewContext>) => void;
}

const FriendCard = (props: Props) => {
  const { relationship, hideFollowAction = false, className } = props;
  const location = useLocation();

  const navigate = useNavigate();

  const isOwnProfile = useAppSelector((state) => state.profile.isOwnProfile);
  const currentTab = getProfileTab(location.pathname);

  const getDisplayName = () => {
    if (relationship.displayName) return relationship.displayName;
    const fullName = [relationship.lastName, relationship.firstName].filter(Boolean).join(" ");
    return fullName || relationship.username || "Unknown";
  };

  const getVariant = () => {
    if (currentTab === SUB_PATH_PROFILE.FOLLOWING) return "following-list";
    if (currentTab === SUB_PATH_PROFILE.FOLLOWERS && isOwnProfile) return "follower-list";
    return "following-list";
  };

  const handlePress = () => {
    navigate(ROUTE_PATHS.PROFILE(relationship.id));
  };

  return (
    <Flex className={`friend-card ${className || ""}`} onClick={handlePress}>
      <Avatar className="friend-card-avatar" src={getAvatarUrl(relationship.profilePicture)} />
      <Flex flex={1} vertical gap={4}>
        <Text
          textType="SB16"
          className="friend-card-displayname"
        >{getDisplayName()}</Text>
        <Text textType="R14" className="friend-card-mutial">
          {`${relationship?.username}`}
        </Text>
      </Flex>
      {!hideFollowAction && relationship.viewerContext && (
        <Flex onClick={(e) => e.stopPropagation()}>
          <FollowStatusCard
            relationship={relationship}
            variant={getVariant()}
            onUpdate={props.onFollowChange}
          />
        </Flex>
      )}
    </Flex>
  );
};

export default FriendCard;
