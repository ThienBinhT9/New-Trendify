import Button from "@/components/button/Button";
import "./Card.scss";
import Text from "@/components/text/Text";
import { IUserRelationship } from "@/stores/profile/constants";
import { memo, useState } from "react";
import Modal from "@/components/modal/Modal";
import { Avatar, Flex } from "antd";
import { useAppDispatch } from "@/stores";
import {
  cancelFollowRequestAction,
  followAction,
  removeFollowerAction,
  unfollowAction,
} from "@/stores/follow/actions";

type TFollowStatusVariant = "profile" | "follower-list" | "following-list";

interface Props {
  relationship: IUserRelationship;
  variant?: TFollowStatusVariant;
}

const FollowStatusCard = (props: Props) => {
  const { relationship, variant = "profile" } = props;

  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useAppDispatch();

  const [showOptionRemove, setShowOptionRemove] = useState<boolean>(false);
  const [showOptionFollowing, setShowOptionFollowing] = useState<boolean>(false);
  const [showOptionRequested, setShowOptionRequested] = useState<boolean>(false);

  const handleFollow = async () => {
    try {
      setIsLoading(true);
      await dispatch(followAction(relationship.id)).unwrap();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    try {
      setIsLoading(true);
      await dispatch(unfollowAction(relationship.id)).unwrap();
      setShowOptionFollowing(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFollower = async () => {
    try {
      setIsLoading(true);
      await dispatch(removeFollowerAction(relationship.id)).unwrap();
      setShowOptionRemove(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setIsLoading(true);
      await dispatch(cancelFollowRequestAction(relationship.id)).unwrap();
      setShowOptionRequested(false);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (relationship.viewerContext.isSelf) return null;

  if (variant === "follower-list" && relationship.viewerContext.isFollowedBy) {
    return (
      <>
        <Modal
          open={showOptionRemove}
          onCancel={() => setShowOptionRemove(false)}
          footer={null}
          className="follow-status-modal"
        >
          <Flex className="follows-status-modal-body">
            <Avatar style={{ width: 84, height: 84 }} src={relationship?.profilePicture?.small} />
            <Flex align="center" gap={4}>
              <Text>Remove</Text>
              <Text textType="M14">{`${relationship?.firstName} ${relationship?.lastName}?`}</Text>
            </Flex>
          </Flex>
          <Flex vertical className="follows-status-modal-footer">
            <Button
              className="follows-status-modal-btn"
              onClick={handleRemoveFollower}
              loading={isLoading}
            >
              <Text textType="SB14" style={{ color: "var(--color-error)" }}>
                Remove
              </Text>
            </Button>
            <Button className="follows-status-modal-btn" onClick={() => setShowOptionRemove(false)}>
              Cancel
            </Button>
          </Flex>
        </Modal>
        <Button type="default" onClick={() => setShowOptionRemove(true)} loading={isLoading}>
          <Text textType="SB14">Remove</Text>
        </Button>
      </>
    );
  }

  if (relationship.viewerContext.isFollowing) {
    return (
      <>
        <Modal
          open={showOptionFollowing}
          onCancel={() => setShowOptionFollowing(false)}
          footer={null}
          className="follow-status-modal"
        >
          <Flex className="follows-status-modal-body">
            <Avatar style={{ width: 84, height: 84 }} src={relationship?.profilePicture?.small} />
            <Flex align="center" gap={4}>
              <Text>Unfollow</Text>
              <Text textType="M14">{`${relationship?.firstName} ${relationship?.lastName}?`}</Text>
            </Flex>
          </Flex>
          <Flex vertical className="follows-status-modal-footer">
            <Button className="follows-status-modal-btn" onClick={handleUnfollow}>
              <Text textType="SB14" style={{ color: "var(--color-error)" }}>
                Unfollow
              </Text>
            </Button>
            <Button
              className="follows-status-modal-btn"
              onClick={() => setShowOptionFollowing(false)}
            >
              Cancel
            </Button>
          </Flex>
        </Modal>
        <Button type="default" onClick={() => setShowOptionFollowing(true)} loading={isLoading}>
          <Text textType="SB14">Following</Text>
        </Button>
      </>
    );
  }

  if (relationship.viewerContext.isRequested) {
    return (
      <>
        <Modal
          open={showOptionRequested}
          onCancel={() => setShowOptionRequested(false)}
          footer={null}
          className="follow-status-modal"
        >
          <Flex className="follows-status-modal-body">
            <Avatar style={{ width: 84, height: 84 }} src={relationship?.profilePicture?.small} />
            <Flex align="center" gap={4}>
              <Text>Cancel follow request to</Text>
              <Text textType="M14">{`${relationship?.firstName} ${relationship?.lastName}?`}</Text>
            </Flex>
          </Flex>
          <Flex vertical className="follows-status-modal-footer">
            <Button
              className="follows-status-modal-btn"
              onClick={handleCancelRequest}
              loading={isLoading}
            >
              <Text textType="SB14" style={{ color: "var(--color-error)" }}>
                Cancel request
              </Text>
            </Button>
            <Button
              className="follows-status-modal-btn"
              onClick={() => setShowOptionRequested(false)}
            >
              Keep
            </Button>
          </Flex>
        </Modal>
        <Button type="default" onClick={() => setShowOptionRequested(true)} loading={isLoading}>
          <Text textType="SB14">Requested</Text>
        </Button>
      </>
    );
  }

  if (!relationship.viewerContext.canFollow) return null;

  return (
    <Button type="primary" onClick={handleFollow} loading={isLoading}>
      <Text textType="SB14">
        {relationship?.viewerContext?.isFollowedBy ? "Follow back" : "Follow"}
      </Text>
    </Button>
  );
};

export default memo(FollowStatusCard);
