import express from "express";
import {
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
} from "../../controllers/adminController.js";
import { authenticateAdminToken } from "../../middleware/auth.js";

const router = express.Router();

// GET /admin/news - Get all news including drafts (admin only)
router.get("/", authenticateAdminToken, getAllNews);

// POST /admin/news - Create a news item (admin only)
router.post("/", authenticateAdminToken, createNews);

// PUT /admin/news/:newsId - Update a news item (admin only)
router.put("/:newsId", authenticateAdminToken, updateNews);

// DELETE /admin/news/:newsId - Soft-delete a news item (admin only)
router.delete("/:newsId", authenticateAdminToken, deleteNews);

export default router;
