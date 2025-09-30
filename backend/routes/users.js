import express from "express";
import {
  getAllUsers,
  createUser,
  getUserById,
  checkUserCredentials,
  updateUser,
} from "../controllers/userController.js";
const router = express.Router();

// GET /users - Get all users
router.get("/", getAllUsers);

// POST /users - Create a new user
router.post("/", createUser);

// GET /users/:id - Get user by ID
router.get("/:id", getUserById);

// POST /users/login - Check user credentials
router.post("/login", checkUserCredentials);

// PUT /users/:id - Update user by ID
router.put("/:id", updateUser);

export default router;
