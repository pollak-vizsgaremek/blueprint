import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  checkUserCredentials,
  updateUser,
  getCurrentUser,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
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
router.get("/", authenticateToken, getAllUsers);

// GET /users/:id - Get user by ID
router.get("/:id", authenticateToken, getUserById);

// PUT /users/:id - Update user by ID
router.put("/:id", authenticateToken, updateUser);

export default router;
