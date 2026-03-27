import type {
  ActivityActor,
  ActivityCategory,
  ActivityFeedResult,
  ActivityNotification,
  ActivityActionType,
  ActivityEventType,
  GetActivityFeedParams,
} from "./activity.types";

import type { ActivityTabKey } from "./activityTabs";

const DEFAULT_PAGE_SIZE = 12;
const NETWORK_DELAY_MS = 700;
const TOTAL_NOTIFICATIONS = 120;

const actorPool: ActivityActor[] = [
  {
    id: "actor-1",
    displayName: "minh.nguyen",
    initials: "MN",
    avatarBg: "#f5deea",
    avatarColor: "#8d375f",
  },
  {
    id: "actor-2",
    displayName: "lan.tran",
    initials: "LT",
    avatarBg: "#dbe7cb",
    avatarColor: "#3e6127",
  },
  {
    id: "actor-3",
    displayName: "duc.khoa",
    initials: "DK",
    avatarBg: "#efe4d2",
    avatarColor: "#8f5f11",
  },
  {
    id: "actor-4",
    displayName: "phuong.ha",
    initials: "PH",
    avatarBg: "#e5e3f5",
    avatarColor: "#4b479f",
  },
  {
    id: "actor-5",
    displayName: "bao.linh",
    initials: "BL",
    avatarBg: "#f1e3dd",
    avatarColor: "#a94d29",
  },
  {
    id: "actor-6",
    displayName: "quoc.anh",
    initials: "QA",
    avatarBg: "#d7ebe7",
    avatarColor: "#176c56",
  },
  {
    id: "actor-7",
    displayName: "huyen.ng",
    initials: "HN",
    avatarBg: "#dceafb",
    avatarColor: "#1f5b96",
  },
  {
    id: "actor-8",
    displayName: "trung.ng",
    initials: "TN",
    avatarBg: "#ffe7de",
    avatarColor: "#9f471f",
  },
];

interface NotificationTemplate {
  category: ActivityCategory;
  type: ActivityEventType;
  actionText: string;
  previewOptions?: string[];
  actionType: ActivityActionType;
  grouped?: boolean;
}

const notificationTemplates: NotificationTemplate[] = [
  {
    category: "mentions",
    type: "like",
    grouped: true,
    actionText: "đã thích bài viết của bạn.",
    previewOptions: [
      "Hôm nay mình thử cà phê trứng lần đầu và thật sự bị chinh phục bởi mùi thơm nhẹ và lớp kem mịn.",
      "Chuyến đi Đà Lạt 3N2Đ này có quá nhiều cảnh đẹp, mình tổng hợp lại full lịch trình cho mọi người.",
      "Mình vừa tổng hợp checklist đi biển cuối tuần để ai cũng pack đồ gọn mà vẫn đủ dùng.",
    ],
    actionType: "media",
  },
  {
    category: "following",
    type: "follow",
    actionText: "đã bắt đầu theo dõi bạn.",
    actionType: "follow",
  },
  {
    category: "mentions",
    type: "reply",
    actionText: "đã trả lời bài viết của bạn.",
    previewOptions: [
      "Mình cũng hay đi chỗ đó lắm, quán ngon thật và phục vụ nhanh nữa.",
      "Bài này quá hữu ích luôn, cảm ơn bạn đã chia sẻ chi tiết như vậy.",
      "Mình đồng ý với góc nhìn này, phần kinh nghiệm thực tế rất đáng tham khảo.",
    ],
    actionType: "none",
  },
  {
    category: "mentions",
    type: "repost",
    actionText: "đã repost bài viết của bạn.",
    previewOptions: [
      "Góc review: Bún bò Huế ở Hoàn Kiếm tưởng không ngon mà ngon không tưởng.",
      "Chuỗi bài chia sẻ kỹ năng làm việc nhóm nên đọc nếu bạn đang quản lý dự án.",
      "Mẹo tối ưu chi tiêu tháng này mình thấy áp dụng cực ổn cho người đi làm.",
    ],
    actionType: "media",
  },
  {
    category: "following",
    type: "follow",
    grouped: true,
    actionText: "đã theo dõi bạn.",
    actionType: "follow",
  },
  {
    category: "mentions",
    type: "mention",
    actionText: "đã nhắc đến bạn trong một bình luận.",
    previewOptions: [
      "@ban ơi bạn xem giúp mình đoạn code xử lý cache này với nhé.",
      "Mình tag bạn vào đây vì đúng chủ đề bạn đang quan tâm nè.",
      "Có nhắc bạn ở phần timeline để mọi người cùng thảo luận tiếp.",
    ],
    actionType: "none",
  },
];

const minuteOffsetSeed = [2, 15, 60, 180, 2880, 4320, 5840, 9000, 14000, 21000];

const formatShortTimeAgo = (date: Date): string => {
  const now = Date.now();
  const diffInMinutes = Math.max(1, Math.floor((now - date.getTime()) / 60000));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }

  return `${Math.floor(diffInDays / 30)}mo`;
};

const pickFromPool = (index: number) => {
  return actorPool[index % actorPool.length];
};

const buildActorSummary = (
  primaryActorName: string,
  extraActorCount: number,
  grouped: boolean,
): string => {
  if (!grouped) {
    return primaryActorName;
  }

  return `${primaryActorName} và ${extraActorCount} người khác`;
};

const buildNotification = (index: number): ActivityNotification => {
  const template = notificationTemplates[index % notificationTemplates.length];
  const primaryActor = pickFromPool(index);
  const secondaryActor = pickFromPool(index + 3);

  const grouped = Boolean(template.grouped);
  const extraActorCount = grouped ? ((index % 3) + 2) : 0;
  const actors = grouped ? [primaryActor, secondaryActor] : [primaryActor];

  const previewOptions = template.previewOptions ?? [];
  const previewText = previewOptions.length
    ? previewOptions[index % previewOptions.length]
    : undefined;

  const minuteOffset = minuteOffsetSeed[index % minuteOffsetSeed.length] + Math.floor(index / 4) * 80;
  const createdAt = new Date(Date.now() - minuteOffset * 60000);

  return {
    id: `activity-${index + 1}`,
    category: template.category,
    type: template.type,
    actors,
    actorSummary: buildActorSummary(primaryActor.displayName, extraActorCount, grouped),
    actionText: template.actionText,
    previewText,
    actionType: template.actionType,
    followLabel: template.actionType === "follow" ? "Theo dõi" : undefined,
    mediaUrl: undefined,
    createdAt: createdAt.toISOString(),
    timeLabel: formatShortTimeAgo(createdAt),
  };
};

const allNotifications = Array.from({ length: TOTAL_NOTIFICATIONS }, (_, index) =>
  buildNotification(index),
);

const notificationByTab: Record<ActivityTabKey, ActivityNotification[]> = {
  all: allNotifications,
  following: allNotifications.filter((item) => item.category === "following"),
  mentions: allNotifications.filter((item) => item.category === "mentions"),
};

const wait = (timeout: number) => {
  return new Promise<void>((resolve) => {
    window.setTimeout(() => resolve(), timeout);
  });
};

export const getMockActivityFeed = async (
  params: GetActivityFeedParams,
): Promise<ActivityFeedResult> => {
  const { tab, cursor = 0, limit = DEFAULT_PAGE_SIZE } = params;

  await wait(NETWORK_DELAY_MS);

  const source = notificationByTab[tab] ?? [];
  const nextCursor = Math.max(0, cursor);
  const nextData = source.slice(nextCursor, nextCursor + limit);
  const updatedCursor = nextCursor + nextData.length;

  return {
    data: nextData,
    cursor: updatedCursor,
    hasNext: updatedCursor < source.length,
  };
};
