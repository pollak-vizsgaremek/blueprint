import express from "express";
import {
  getAllEvents,
  registerForEvent,
  unregisterFromEvent,
  getUserEventRegistrations,
  getEventRegistrations,
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

export default router;
