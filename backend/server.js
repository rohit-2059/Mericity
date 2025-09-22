  require("dotenv").config();
  const express = require("express");
  const mongoose = require("mongoose");
  const cors = require("cors");

  const authRoutes = require("./routes/auth");
  const userRoutes = require("./routes/user");
  const complaintRoutes = require("./routes/complaints");
  const adminRoutes = require("./routes/admin");
  const janawaazRoutes = require("./routes/janawaaz");
  const rewardsRoutes = require("./routes/rewards");
  const notificationRoutes = require("./routes/notifications");
  const departmentRoutes = require("./routes/department");
  const chatRoutes = require("./routes/chat");

  // Import vision route (but don't use it yet)
  const visionOcrRoute = require('./routes/vision-ocr');

  const app = express();

  // CORS configuration for Google OAuth
  app.use(
    cors({
      origin: ["http://localhost:5173", "http://localhost:5174"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      exposedHeaders: ["Cross-Origin-Opener-Policy"],
      optionsSuccessStatus: 200,
    })
  );

  // Security headers for Google OAuth
  app.use((req, res, next) => {
    res.header("Cross-Origin-Opener-Policy", "unsafe-none");
    res.header("Cross-Origin-Embedder-Policy", "unsafe-none");
    res.header("Referrer-Policy", "no-referrer-when-downgrade");
    next();
  });

  app.use(express.json());

  // --- Debug request logger (temporary) ---
  app.use((req, _res, next) => {
    try {
      const bodyPreview =
        typeof req.body === "object"
          ? JSON.stringify(req.body).slice(0, 300)
          : "";
      console.log(`[REQ] ${req.method} ${req.originalUrl} ${bodyPreview}`);
    } catch {
      console.log(`[REQ] ${req.method} ${req.originalUrl}`);
    }
    next();
  });

  // Serve uploaded files statically
  app.use("/uploads", express.static("uploads"));

  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error(err));

  // All your existing routes
  app.use("/auth", authRoutes);
  app.use("/user", userRoutes);
  app.use("/complaints", complaintRoutes);
  app.use("/admin", adminRoutes);
  app.use("/janawaaz", janawaazRoutes);
  app.use("/rewards", rewardsRoutes);
  app.use("/notifications", notificationRoutes);
  app.use("/department", departmentRoutes);
  app.use("/chat", chatRoutes);

  // ADD VISION ROUTE HERE - AFTER ALL MIDDLEWARE
  app.use(visionOcrRoute);

  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('✅ Vision OCR endpoint available at: POST /api/vision-ocr');
  });
