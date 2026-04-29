import express from "express";
import {
  getAdminEvents,
  createEvent,
  deleteEvent,
  restoreEvent,
  updateEvent,
  createAdminRegistration,
  updateAdminRegistration,
  deleteAdminRegistration,
  updateAdminComment,
} from "../../controllers/adminController.js";
import { authenticateAdminToken } from "../../middleware/auth.js";
import { uploadEventImage } from "../../middleware/upload.js";

const router = express.Router();

// POST /events - Create a new event (requires admin authentication and supports image upload)
router.get("/", authenticateAdminToken, getAdminEvents);

// POST /events - Create a new event (requires admin authentication and supports image upload)
router.post("/", authenticateAdminToken, uploadEventImage, createEvent);

// PUT /events/:eventId - Update an event (requires admin authentication and supports image upload)
router.put("/:eventId", authenticateAdminToken, uploadEventImage, updateEvent);

// DELETE /admin/events/:eventId - Delete an event (requires admin authentication)
router.delete("/:eventId", authenticateAdminToken, deleteEvent);

// PUT /admin/events/:eventId/restore - Restore a soft-deleted event
router.put("/:eventId/restore", authenticateAdminToken, restoreEvent);

// POST /admin/events/:eventId/registrations - Create a registration for a user
router.post(
  "/:eventId/registrations",
  authenticateAdminToken,
  createAdminRegistration,
);

// PUT /admin/events/:eventId/registrations/:registrationId - Update registration status
router.put(
  "/:eventId/registrations/:registrationId",
  authenticateAdminToken,
  updateAdminRegistration,
);

// DELETE /admin/events/:eventId/registrations/:registrationId - Delete a registration
router.delete(
  "/:eventId/registrations/:registrationId",
  authenticateAdminToken,
  deleteAdminRegistration,
);

// PUT /admin/events/:eventId/comments/:commentId - Update/moderate a comment
router.put(
  "/:eventId/comments/:commentId",
  authenticateAdminToken,
  updateAdminComment,
);

export default router;
