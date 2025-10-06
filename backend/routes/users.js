import express from "express";
import {
  createUser,
  getCurrentUser,
  updateCurrentUser,
  userLogin,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /users - Create a new user (register)
router.post("/", createUser);

// POST /users/login - Check user credentials (login)
router.post("/login", userLogin);

// GET /users/profile - Get current user profile
router.get("/profile", authenticateToken, getCurrentUser);

// PUT /users/profile - Update current user profile
router.put("/profile", authenticateToken, updateCurrentUser);

export default router;
