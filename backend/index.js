import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import adminEventsRoutes from "./routes/admin/adminEvents.js";
import adminUserRoutes from "./routes/admin/adminUsers.js";

const app = express();

// CORS configuration to allow credentials (cookies)
// Get PUBLIC_URL from environment and derive allowed origins
const PUBLIC_URL = process.env.PUBLIC_URL || "http://localhost";

const allowedOrigins = [
  PUBLIC_URL, // Main application URL (e.g., http://localhost or https://yourdomain.com)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or same-origin)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`CORS blocked origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check endpoint (no authentication required)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/events", eventRoutes);
app.use("/users", userRoutes);
app.use("/admin/events", adminEventsRoutes);
app.use("/admin/users", adminUserRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
