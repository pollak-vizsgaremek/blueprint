import express from "express";
import {
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  getUserEventRegistrations,
  getEventRegistrations,
} from "../controllers/eventController.js";
import {
  authenticateToken,
  authenticateAdminToken,
  optionalAuth,
} from "../middleware/auth.js";
import { uploadEventImage } from "../middleware/upload.js";

const router = express.Router();

// GET /events - Get all events (public route with optional auth)
router.get("/", optionalAuth, getAllEvents);

// GET /events/my-registrations - Get user's event registrations (requires authentication)
router.get("/my-registrations", authenticateToken, getUserEventRegistrations);

// POST /events - Create a new event (requires admin authentication and supports image upload)
router.post("/", authenticateAdminToken, uploadEventImage, createEvent);

// PUT /events/:eventId - Update an event (requires admin authentication and supports image upload)
router.put("/:eventId", authenticateAdminToken, uploadEventImage, updateEvent);

// DELETE /events/:eventId - Delete an event (requires admin authentication)
router.delete("/:eventId", authenticateAdminToken, deleteEvent);

// POST /events/:eventId/register - Register for an event (requires authentication)
router.post("/:eventId/register", authenticateToken, registerForEvent);

// DELETE /events/:eventId/register - Unregister from an event (requires authentication)
router.delete("/:eventId/register", authenticateToken, unregisterFromEvent);

// GET /events/:eventId/registrations - Get event registrations (requires authentication)
router.get("/:eventId/registrations", authenticateToken, getEventRegistrations);

export default router;
