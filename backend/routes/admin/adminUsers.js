import {
  getAllUsers,
  getUserById,
  updateUser,
} from "../../controllers/adminController";
import { authenticateAdminToken } from "../../middleware/auth";

const router = express.Router();

// GET /users - Get all users (admin only)
router.get("/", authenticateAdminToken, getAllUsers);

// GET /users/:id - Get user by ID
router.get("/:id", authenticateAdminToken, getUserById);

// PUT /users/:id - Update user by ID
router.put("/:id", authenticateAdminToken, updateUser);
export default router;
