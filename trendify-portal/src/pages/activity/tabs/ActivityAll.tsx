import ActivityNotificationList from "../components/ActivityNotificationList";

const ActivityAll = ({ isActive }: { isActive?: boolean }) => {
  return <ActivityNotificationList tabKey="all" isActive={isActive} />;
};

export default ActivityAll;
