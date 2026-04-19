import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import adminEventsRoutes from "./routes/admin/adminEvents.js";
import adminUserRoutes from "./routes/admin/adminUsers.js";
import appointmentRoutes from "./routes/appointments.js";

const app = express();

// CORS configuration to allow credentials (cookies)
// Get CORS origins from environment and normalize missing protocols.
const normalizeOrigin = (value) => {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) return null;

  const withProtocol =
    trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `http://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
};

const isLocalhostOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    return (
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1" ||
      parsed.hostname.endsWith(".localhost")
    );
  } catch {
    return false;
  }
};

const configuredOrigins = [process.env.PUBLIC_URL, process.env.CORS_ORIGINS]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map(normalizeOrigin)
  .filter(Boolean);

const allowedOrigins = Array.from(
  new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    ...configuredOrigins,
  ]),
);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || isLocalhostOrigin(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint (no authentication required)
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/events", eventRoutes);
app.use("/users", userRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/admin/events", adminEventsRoutes);
app.use("/admin/users", adminUserRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
