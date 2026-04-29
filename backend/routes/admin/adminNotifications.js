import express from "express";
import {
  getAllNotifications,
  createNotification,
  updateNotification,
  deleteNotification,
} from "../../controllers/adminController.js";
import { authenticateAdminToken } from "../../middleware/auth.js";

const router = express.Router();

// GET /admin/notifications - Get all notifications (admin only)
router.get("/", authenticateAdminToken, getAllNotifications);

// POST /admin/notifications - Create a notification (admin only)
router.post("/", authenticateAdminToken, createNotification);

// PUT /admin/notifications/:notificationId - Update a notification (admin only)
router.put("/:notificationId", authenticateAdminToken, updateNotification);

// DELETE /admin/notifications/:notificationId - Delete a notification (admin only)
router.delete("/:notificationId", authenticateAdminToken, deleteNotification);

export default router;
