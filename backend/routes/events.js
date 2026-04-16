import express from "express";
import {
  getAllEvents,
  registerForEvent,
  unregisterFromEvent,
  getUserEventRegistrations,
  getEventRegistrations,
  getEventComments,
  createEventComment,
  deleteEventComment,
} from "../controllers/eventController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /events - Get all events (public route with optional auth)
router.get("/", authenticateToken, getAllEvents);

// GET /events/my-registrations - Get user's event registrations (requires authentication)
router.get("/my-registrations", authenticateToken, getUserEventRegistrations);

// POST /events/:eventId/register - Register for an event (requires authentication)
router.post("/:eventId/register", authenticateToken, registerForEvent);

// DELETE /events/:eventId/register - Unregister from an event (requires authentication)
router.delete("/:eventId/register", authenticateToken, unregisterFromEvent);

// GET /events/:eventId/registrations - Get event registrations (requires authentication)
router.get("/:eventId/registrations", authenticateToken, getEventRegistrations);

// GET /events/:eventId/comments - Get event comments (requires authentication)
router.get("/:eventId/comments", authenticateToken, getEventComments);

// POST /events/:eventId/comments - Create event comment (requires authentication)
router.post("/:eventId/comments", authenticateToken, createEventComment);

// DELETE /events/:eventId/comments/:commentId - Delete event comment (requires authentication)
router.delete(
  "/:eventId/comments/:commentId",
  authenticateToken,
  deleteEventComment,
);

export default router;
