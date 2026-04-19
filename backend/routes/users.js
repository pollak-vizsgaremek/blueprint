import express from "express";
import {
  createUser,
  getCurrentUser,
  getTeachers,
  updateCurrentUser,
  userLogin,
  userLogout,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// POST /users - Create a new user (register)
router.post("/", createUser);

// POST /users/login - Check user credentials (login)
router.post("/login", userLogin);

// POST /users/logout - Logout user
router.post("/logout", userLogout);

// GET /users/profile - Get current user profile
router.get("/profile", authenticateToken, getCurrentUser);

// GET /users/teachers - Get all teachers
router.get("/teachers", authenticateToken, getTeachers);

// PUT /users/profile - Update current user profile
router.put("/profile", authenticateToken, updateCurrentUser);

export default router;
