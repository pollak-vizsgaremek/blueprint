import express from "express";
import cors from "cors";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/events", eventRoutes);
app.use("/users", userRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
