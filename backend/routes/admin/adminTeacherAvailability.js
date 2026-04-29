import express from "express";
import {
  createTeacherAvailability,
  deleteTeacherAvailability,
  getTeacherAvailability,
  updateTeacherAvailability,
} from "../../controllers/teacherAvailabilityController.js";
import { authenticateAdminToken } from "../../middleware/auth.js";

const router = express.Router();

router.get("/:teacherId", authenticateAdminToken, getTeacherAvailability);
router.post("/", authenticateAdminToken, createTeacherAvailability);
router.put(
  "/:availabilityId",
  authenticateAdminToken,
  updateTeacherAvailability,
);
router.delete(
  "/:availabilityId",
  authenticateAdminToken,
  deleteTeacherAvailability,
);

export default router;
