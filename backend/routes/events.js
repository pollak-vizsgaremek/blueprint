import express from "express";
import {
  createEventNews,
  deleteEventNews,
  getAllEvents,
  getEventNews,
  getPublishedNews,
  getLatestPublishedNews,
  registerForEvent,
  unregisterFromEvent,
  getUserEventRegistrations,
  getEventRegistrations,
  getEventComments,
  createEventComment,
  deleteEventComment,
  updateEventNews,
} from "../controllers/eventController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /events - Get all events (public route with optional auth)
router.get("/", authenticateToken, getAllEvents);

// GET /events/news/latest - Get latest published news item
router.get("/news/latest", authenticateToken, getLatestPublishedNews);

// GET /events/news - Get all published news items
router.get("/news", authenticateToken, getPublishedNews);

// GET /events/:eventId/news - Get event specific news (owner can see drafts)
router.get("/:eventId/news", authenticateToken, getEventNews);

// POST /events/:eventId/news - Create event news (owner/admin only)
router.post("/:eventId/news", authenticateToken, createEventNews);

// PUT /events/:eventId/news/:newsId - Publish/unpublish event news (owner/admin only)
router.put("/:eventId/news/:newsId", authenticateToken, updateEventNews);

// DELETE /events/:eventId/news/:newsId - Delete event news (owner/admin only)
router.delete("/:eventId/news/:newsId", authenticateToken, deleteEventNews);

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
