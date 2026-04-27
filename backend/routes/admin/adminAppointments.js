import express from "express";
import {
  getAllAppointments,
  createAdminAppointment,
  updateAdminAppointment,
  deleteAdminAppointment,
} from "../../controllers/adminController.js";
import { authenticateAdminToken } from "../../middleware/auth.js";

const router = express.Router();

// GET /admin/appointments - Get all appointments (admin only)
router.get("/", authenticateAdminToken, getAllAppointments);

// POST /admin/appointments - Create an appointment (admin only)
router.post("/", authenticateAdminToken, createAdminAppointment);

// PUT /admin/appointments/:appointmentId - Update an appointment (admin only)
router.put("/:appointmentId", authenticateAdminToken, updateAdminAppointment);

// DELETE /admin/appointments/:appointmentId - Delete an appointment (admin only)
router.delete("/:appointmentId", authenticateAdminToken, deleteAdminAppointment);

export default router;
