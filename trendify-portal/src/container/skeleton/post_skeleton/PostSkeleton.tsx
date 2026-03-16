import { Flex, Skeleton } from "antd";

const PostSkeleton = () => (
  <Flex vertical gap={12} className="post-skeleton">
    <Skeleton
      avatar
      title={{ width: "40%", style: { height: 16 } }}
      paragraph={{ rows: 2, width: ["100%", "60%"] }}
      active
    />
  </Flex>
);

export default PostSkeleton;
