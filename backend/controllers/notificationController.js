import prisma from "../config/database.js";

export const getCurrentUserNotifications = async (req, res) => {
  const userId = req.user.id;
  const limitParam = parseInt(req.query.limit, 10);
  const offsetParam = parseInt(req.query.offset, 10);
  const onlyUnread =
    req.query.onlyUnread === "true" || req.query.onlyUnread === "1";

  const limit = Number.isNaN(limitParam)
    ? 20
    : Math.min(Math.max(limitParam, 1), 100);
  const offset = Number.isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0);

  try {
    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          userId,
          ...(onlyUnread ? { isRead: false } : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          ...(onlyUnread ? { isRead: false } : {}),
        },
      }),
    ]);

    res.json({
      message: "Notifications retrieved successfully",
      notifications,
      unreadCount,
      totalCount,
      hasMore: offset + notifications.length < totalCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      message: "Unread notification count retrieved successfully",
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markNotificationAsRead = async (req, res) => {
  const userId = req.user.id;
  const notificationId = parseInt(req.params.notificationId, 10);

  if (Number.isNaN(notificationId)) {
    return res.status(400).json({
      error: "Invalid notification ID",
      message: "Notification ID must be a number",
    });
  }

  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updated = await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        isRead: true,
      },
    });

    res.json({
      message: "Notification marked as read",
      notification: updated,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markAllNotificationsAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.json({
      message: "All notifications marked as read",
      updatedCount: result.count,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotification = async (req, res) => {
  const userId = req.user.id;
  const notificationId = parseInt(req.params.notificationId, 10);

  if (Number.isNaN(notificationId)) {
    return res.status(400).json({
      error: "Invalid notification ID",
      message: "Notification ID must be a number",
    });
  }

  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await prisma.notification.delete({
      where: {
        id: notificationId,
      },
    });

    res.json({
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
