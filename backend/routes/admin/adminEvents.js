import {
  createEvent,
  deleteEvent,
  updateEvent,
} from "../controllers/adminController";
import { authenticateAdminToken } from "../middleware/auth";
import { uploadEventImage } from "../middleware/upload";

const router = express.Router();

// POST /events - Create a new event (requires admin authentication and supports image upload)
router.post("/", authenticateAdminToken, uploadEventImage, createEvent);

// PUT /events/:eventId - Update an event (requires admin authentication and supports image upload)
router.put("/:eventId", authenticateAdminToken, uploadEventImage, updateEvent);

// DELETE /events/:eventId - Delete an event (requires admin authentication)
router.delete("/:eventId", authenticateAdminToken, deleteEvent);

export default router;
