import { Flex, Skeleton } from "antd";

interface ActivityNotificationSkeletonProps {
  count?: number;
  className?: string;
}

const ActivityNotificationSkeleton = ({
  count = 4,
  className,
}: ActivityNotificationSkeletonProps) => {
  return (
    <Flex vertical gap={8} className={`activity-notification-skeleton ${className || ""}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Flex align="center" className="activity-notification-item activity-notification-item--skeleton" key={index}>
          <Skeleton.Avatar active size={56} shape="circle" />

          <Flex vertical flex={1} className="activity-notification-item--skeleton__content">
            <Skeleton.Input
              active
              size="small"
              style={{ width: index % 2 === 0 ? "72%" : "58%", height: 18 }}
            />
            <Skeleton.Input
              active
              size="small"
              style={{ width: index % 2 === 0 ? "54%" : "68%", height: 16 }}
            />
          </Flex>

          <Flex vertical align="flex-end" className="activity-notification-item--skeleton__meta">
            <Skeleton.Input active size="small" style={{ width: 24, height: 18 }} />
            <Skeleton.Button active style={{ width: 104, height: 48, borderRadius: 14 }} />
          </Flex>
        </Flex>
      ))}
    </Flex>
  );
};

export default ActivityNotificationSkeleton;
