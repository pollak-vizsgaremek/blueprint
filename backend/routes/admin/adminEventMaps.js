import express from "express";
import {
  createEventMap,
  deleteEventMap,
  getEventMaps,
  updateEventMap,
} from "../../controllers/adminController.js";
import { authenticateAdminToken } from "../../middleware/auth.js";
import { uploadEventMapImage } from "../../middleware/upload.js";

const router = express.Router();

router.get("/", authenticateAdminToken, getEventMaps);
router.post("/", authenticateAdminToken, uploadEventMapImage, createEventMap);
router.put(
  "/:mapId",
  authenticateAdminToken,
  uploadEventMapImage,
  updateEventMap,
);
router.delete("/:mapId", authenticateAdminToken, deleteEventMap);

export default router;
