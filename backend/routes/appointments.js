import express from "express";
import {
  createAppointment,
  deleteAppointment,
  getCurrentUserAppointments,
  getTeacherOccupiedSlots,
  updateAppointment,
} from "../controllers/appointmentController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, getCurrentUserAppointments);
router.get(
  "/teacher/:teacherId/occupied",
  authenticateToken,
  getTeacherOccupiedSlots,
);
router.post("/", authenticateToken, createAppointment);
router.put("/:appointmentId", authenticateToken, updateAppointment);
router.delete("/:appointmentId", authenticateToken, deleteAppointment);

export default router;
