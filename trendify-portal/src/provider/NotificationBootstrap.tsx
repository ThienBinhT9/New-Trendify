import { useNotifications } from "@/hooks/useNotifications";

const NotificationBootstrap = () => {
  useNotifications({
    showToast: false,
    enabled: true,
    listenSocket: true,
    autoSyncOnConnected: true,
    syncMissedOnConnected: false,
    syncUnreadCountOnConnected: true,
  });

  return null;
};

export default NotificationBootstrap;
