import express from "express";
import { getTeacherAvailability } from "../controllers/teacherAvailabilityController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:teacherId", authenticateToken, getTeacherAvailability);

export default router;
