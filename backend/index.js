import express from "express";
import cors from "cors";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import adminEventsRoutes from "./routes/admin/adminEvents.js";
import adminUserRoutes from "./routes/admin/adminUsers.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/events", eventRoutes);
app.use("/users", userRoutes);
app.use("/admin/events", adminEventsRoutes);
app.use("/admin/users", adminUserRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
