import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  checkUserCredentials,
  updateUser,
  getCurrentUser,
  promoteToAdmin,
  demoteFromAdmin,
} from "../controllers/userController.js";
import {
  authenticateToken,
  authenticateAdminToken,
} from "../middleware/auth.js";
const router = express.Router();

// Public routes (no authentication required)
// POST /users - Create a new user (register)
router.post("/", createUser);

// POST /users/login - Check user credentials (login)
router.post("/login", checkUserCredentials);

// Protected routes (authentication required)
// GET /users/profile - Get current user profile
router.get("/profile", authenticateToken, getCurrentUser);

// GET /users - Get all users (admin only)
router.get("/", authenticateAdminToken, getAllUsers);

// GET /users/:id - Get user by ID
router.get("/:id", authenticateToken, getUserById);

// PUT /users/:id - Update user by ID
router.put("/:id", authenticateToken, updateUser);

// Admin-only routes
// PUT /users/:id/promote - Promote user to admin (admin only)
router.put("/:id/promote", authenticateAdminToken, promoteToAdmin);
// PUT /users/:id/demote - Demote admin to regular user (admin only)
router.put("/:id/demote", authenticateAdminToken, demoteFromAdmin);

export default router;
