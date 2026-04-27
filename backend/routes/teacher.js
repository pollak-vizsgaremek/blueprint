import express from "express";
import {
  createOwnTeacherAvailability,
  createTeacherEvent,
  deleteOwnTeacherAvailability,
  getOwnTeacherAvailability,
  getTeacherAppointments,
  getTeacherCreatedEvents,
  updateOwnTeacherAvailability,
  updateTeacherAppointmentStatus,
} from "../controllers/teacherController.js";
import { authenticateTeacherToken } from "../middleware/auth.js";
import { uploadEventImage } from "../middleware/upload.js";

const router = express.Router();

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

export default router;
