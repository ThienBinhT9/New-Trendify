import { Flex, Skeleton } from "antd";

import "./ConversationItem.scss";

const ConversationItemSkeleton = () => {
  return (
    <Flex gap={10} className="conversation-item" align="center">
      <Skeleton.Avatar active size={44} shape="circle" style={{ flexShrink: 0 }} />
      <Flex vertical flex={1} style={{ overflow: "hidden" }} justify="center" gap={4}>
        <Flex justify="space-between" align="center">
          <Skeleton.Button active size="small" style={{ width: 100, height: 14 }} />
          <Skeleton.Button active size="small" style={{ width: 30, height: 12 }} />
        </Flex>
        <Flex justify="space-between" align="center" style={{ marginTop: 2 }}>
          <Skeleton.Button active size="small" style={{ width: 140, height: 12 }} />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default ConversationItemSkeleton;
