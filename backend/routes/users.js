import express from "express";
import {
  confirmEmail,
  createUser,
  getCurrentUser,
  getTeachers,
  requestEmailConfirmation,
  requestPasswordReset,
  resetPassword,
  updateCurrentUser,
  userLogin,
  userLogout,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// POST /users - Create a new user (register)
router.post("/", authRateLimiter, createUser);

// POST /users/login - Check user credentials (login)
router.post("/login", authRateLimiter, userLogin);

// POST /users/logout - Logout user
router.post("/logout", userLogout);

// POST /users/email-confirmation/request - Request confirmation email
router.post("/email-confirmation/request", requestEmailConfirmation);

// POST /users/email-confirmation/confirm - Confirm email with token
router.post("/email-confirmation/confirm", confirmEmail);

// POST /users/password-reset/request - Request password reset email
router.post("/password-reset/request", requestPasswordReset);

// POST /users/password-reset/confirm - Reset password using token
router.post("/password-reset/confirm", resetPassword);

// GET /users/profile - Get current user profile
router.get("/profile", authenticateToken, getCurrentUser);

// GET /users/teachers - Get all teachers
router.get("/teachers", authenticateToken, getTeachers);

// PUT /users/profile - Update current user profile
router.put("/profile", authenticateToken, updateCurrentUser);

export default router;
