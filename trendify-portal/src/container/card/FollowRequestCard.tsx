import Button from "@/components/button/Button";
import Text from "@/components/text/Text";
import { useAppDispatch } from "@/stores";
import { acceptFollowRequestAction, rejectFollowRequestAction } from "@/stores/follow/actions";
import { IUserRelationship } from "@/stores/profile/constants";
import { Flex } from "antd";
import { useState } from "react";

interface Props {
  relationship: IUserRelationship;
}

const FollowRequestCard = ({ relationship }: Props) => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      await dispatch(acceptFollowRequestAction(relationship.id)).unwrap();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      await dispatch(rejectFollowRequestAction(relationship.id)).unwrap();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (relationship.viewerContext.isSelf) return null;
  if (!relationship.viewerContext.isRequestedByThem) return null;

  return (
    <Flex align="center" justify="end" gap={8} className="mb-12">
      <Flex align="center" gap={4}>
        <Text textType="SB14">{`${relationship.firstName} ${relationship.lastName}`}</Text>
        <Text>wants to follow you</Text>
      </Flex>
      <Flex gap={8}>
        <Button type="primary" onClick={handleAccept} loading={isLoading}>
          <Text textType="SB14">Confirm</Text>
        </Button>
        <Button type="default" onClick={handleReject} loading={isLoading}>
          <Text textType="SB14">Delete</Text>
        </Button>
      </Flex>
    </Flex>
  );
};

export default FollowRequestCard;
