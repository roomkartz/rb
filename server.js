import express from "express";
import cors from "cors";
import connectDB from "./db.js";
import userRoutes from "./routes/userRoutes.js";

connectDB();

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Optional: Enable CORS if your frontend runs on a different domain/port
const corsOptions = {
  origin: "https://www.roomkartz.com",
  methods: "GET,POST,PUT,DELETE,PATCH",
  credentials: true,
};
app.use(cors(corsOptions));
app.use("/uploads", express.static("uploads")); // Serve static files

// Routes
app.use("/api/users", userRoutes);
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = 5005;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
