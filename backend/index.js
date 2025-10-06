import express from "express";
import cors from "cors";
import eventRoutes from "./routes/events.js";
import userRoutes from "./routes/users.js";
import adminRoutes from "./routes/admin.js";

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/events", eventRoutes);
app.use("/users", userRoutes);
app.use("/admin", adminRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
