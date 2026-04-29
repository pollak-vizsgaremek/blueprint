import express from "express";
import {
  createOwnTeacherAvailability,
  createTeacherEvent,
  deleteOwnTeacherAvailability,
  getOwnTeacherAvailability,
  getTeacherAppointments,
  getTeacherCreatedEvents,
  getTeacherProfile,
  updateOwnTeacherAvailability,
  updateTeacherAppointmentStatus,
  updateTeacherEvent,
  updateTeacherProfile,
} from "../controllers/teacherController.js";
import { authenticateTeacherToken } from "../middleware/auth.js";
import { uploadEventImage } from "../middleware/upload.js";

const router = express.Router();

router.get("/profile", authenticateTeacherToken, getTeacherProfile);
router.put("/profile", authenticateTeacherToken, updateTeacherProfile);

router.get("/appointments", authenticateTeacherToken, getTeacherAppointments);
router.put(
  "/appointments/:appointmentId",
  authenticateTeacherToken,
  updateTeacherAppointmentStatus,
);

router.get(
  "/availability",
  authenticateTeacherToken,
  getOwnTeacherAvailability,
);
router.post(
  "/availability",
  authenticateTeacherToken,
  createOwnTeacherAvailability,
);
router.put(
  "/availability/:availabilityId",
  authenticateTeacherToken,
  updateOwnTeacherAvailability,
);
router.delete(
  "/availability/:availabilityId",
  authenticateTeacherToken,
  deleteOwnTeacherAvailability,
);

router.get("/events", authenticateTeacherToken, getTeacherCreatedEvents);
router.post(
  "/events",
  authenticateTeacherToken,
  uploadEventImage,
  createTeacherEvent,
);
router.put(
  "/events/:eventId",
  authenticateTeacherToken,
  uploadEventImage,
  updateTeacherEvent,
);

export default router;
