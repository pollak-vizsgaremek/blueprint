import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import adminEventsRoutes from "./routes/admin/adminEvents.js";
import adminUserRoutes from "./routes/admin/adminUsers.js";

const app = express();

// CORS configuration to allow credentials (cookies)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/events", eventRoutes);
app.use("/users", userRoutes);
app.use("/admin/events", adminEventsRoutes);
app.use("/admin/users", adminUserRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
