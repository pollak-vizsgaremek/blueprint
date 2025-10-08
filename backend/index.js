import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import adminEventsRoutes from "./routes/admin/adminEvents.js";
import adminUserRoutes from "./routes/admin/adminUsers.js";

const app = express();

// CORS configuration to allow credentials (cookies)
const allowedOrigins = [
  "https://gemes.eu",
  "https://blueprint.gemes.eu",
  "https://blueprint-api.gemes.eu",
  "http://localhost:3000",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
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
