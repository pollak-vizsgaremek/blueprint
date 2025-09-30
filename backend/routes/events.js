import express from "express";
import { getAllEvents, createEvent } from "../controllers/eventController.js";

const router = express.Router();

// GET /events - Get all events
router.get("/", getAllEvents);

// POST /events - Create a new event
router.post("/", createEvent);

export default router;
