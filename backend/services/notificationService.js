import prisma from "../config/database.js";

const normalizeType = (type) => {
  const allowedTypes = new Set(["info", "warning", "success", "error"]);
  if (!type || typeof type !== "string") {
    return "info";
  }

  return allowedTypes.has(type) ? type : "info";
};

const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailReminders: true,
  eventUpdates: true,
  commentsReplies: false,
  marketingNews: false,
};

const categoryToSettingKey = {
  event_updates: "eventUpdates",
  appointments: "eventUpdates",
  comments: "commentsReplies",
  marketing: "marketingNews",
  reminders: "emailReminders",
};

const normalizeSettingJson = (settingJson) => {
  if (!settingJson || typeof settingJson !== "object") {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...settingJson,
  };
};

const isNotificationCategoryEnabled = (settingJson, category) => {
  if (!category) {
    return true;
  }

  const settingKey = categoryToSettingKey[category];
  if (!settingKey) {
    return true;
  }

  const normalized = normalizeSettingJson(settingJson);
  return normalized[settingKey] !== false;
};

export const createNotification = async ({
  userId,
  title,
  message,
  url = null,
  type = "info",
  category = null,
}) => {
  if (!userId || !title || !message) {
    return null;
  }

  if (category) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settingJson: true },
    });

    if (!isNotificationCategoryEnabled(user?.settingJson, category)) {
      return null;
    }
  }

  return prisma.notification.create({
    data: {
      userId,
      title,
      message,
      url,
      type: normalizeType(type),
    },
  });
};

export const createBulkNotifications = async (notifications) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return { count: 0 };
  }

  const sanitized = notifications
    .filter((item) => item?.userId && item?.title && item?.message)
    .map((item) => ({
      userId: item.userId,
      title: item.title,
      message: item.message,
      url: item.url ?? null,
      type: normalizeType(item.type),
      category: item.category ?? null,
    }));

  if (sanitized.length === 0) {
    return { count: 0 };
  }

  const userIds = Array.from(new Set(sanitized.map((item) => item.userId)));
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      settingJson: true,
    },
  });

  const userSettingMap = new Map(
    users.map((user) => [user.id, user.settingJson ?? null]),
  );

  const filtered = sanitized.filter((item) => {
    return isNotificationCategoryEnabled(
      userSettingMap.get(item.userId),
      item.category,
    );
  });

  if (filtered.length === 0) {
    return { count: 0 };
  }

  return prisma.notification.createMany({
    data: filtered.map((item) => ({
      userId: item.userId,
      title: item.title,
      message: item.message,
      url: item.url,
      type: item.type,
    })),
  });
};
