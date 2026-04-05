import ActivityNotificationList from "../components/ActivityNotificationList";

const ActivityUnread = ({ isActive }: { isActive?: boolean }) => {
  return <ActivityNotificationList tabKey="unread" isActive={isActive} />;
};

export default ActivityUnread;
