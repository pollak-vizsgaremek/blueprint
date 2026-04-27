import express from "express";
import {
  deleteNotification,
  getCurrentUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../controllers/notificationController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, getCurrentUserNotifications);
router.get("/unread-count", authenticateToken, getUnreadNotificationCount);
router.patch("/read-all", authenticateToken, markAllNotificationsAsRead);
router.patch(
  "/:notificationId/read",
  authenticateToken,
  markNotificationAsRead,
);
router.delete("/:notificationId", authenticateToken, deleteNotification);

export default router;
