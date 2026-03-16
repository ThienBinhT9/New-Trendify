import { useState } from "react";
import { Avatar, Flex } from "antd";

import Text from "@/components/text/Text";
import Button from "@/components/button/Button";
import { IUserRelationship } from "@/stores/profile/constants";
import { useAppDispatch } from "@/stores";
import { unblockAction } from "@/stores/follow/actions";
import "./Card.scss";

interface Props {
  relationship: IUserRelationship;
}

const BlockedCard = ({ relationship }: Props) => {
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);

  const handleUnblock = async () => {
    try {
      setIsLoading(true);
      await dispatch(unblockAction(relationship.id)).unwrap();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Flex className="blocked-card" align="center" gap={12}>
      <Avatar size={44} src={relationship.profilePicture?.small} className="blocked-card__avatar">
        {relationship.firstName?.[0]}
      </Avatar>

      <Flex vertical flex={1} gap={2}>
        <Text textType="SB14" className="blocked-card__name">
          {`${relationship.firstName}${relationship.lastName ? " " + relationship.lastName : ""}`}
        </Text>
        <Text textType="R12" className="blocked-card__username">
          {`@${relationship.username}`}
        </Text>
      </Flex>

      <Button
        size="middle"
        className="blocked-card__unblock-btn"
        loading={isLoading}
        onClick={handleUnblock}
      >
        Bỏ chặn
      </Button>
    </Flex>
  );
};

export default BlockedCard;
