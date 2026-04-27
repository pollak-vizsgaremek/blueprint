import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  createAdminUser,
} from "../../controllers/adminController.js";
import { authenticateAdminToken } from "../../middleware/auth.js";

const router = express.Router();

// GET /admin/users - Get all users (admin only)
router.get("/", authenticateAdminToken, getAllUsers);

// POST /admin/users - Create a new user (admin only, supports role/status/emailVerified)
router.post("/", authenticateAdminToken, createAdminUser);

// GET /admin/users/:id - Get user by ID
router.get("/:id", authenticateAdminToken, getUserById);

// PUT /admin/users/:id - Update user by ID
router.put("/:id", authenticateAdminToken, updateUser);

export default router;
