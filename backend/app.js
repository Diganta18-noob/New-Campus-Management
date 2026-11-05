const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const logger = require("./utils/logger");

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim())
      : "http://localhost:5173",
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);
app.use('/api/', (req, res, next) => {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (durationMs >= 1000) logger.warn('Slow API request', { method: req.method, path: req.path, status: res.statusCode, durationMs: Math.round(durationMs) });
  });
  next();
});

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const batchRoutes = require("./routes/batch.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const dailyUpdateRoutes = require("./routes/dailyUpdate.routes");
const auditRoutes = require("./routes/audit.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const departmentRoutes = require("./routes/department.routes");
const classroomRoutes = require("./routes/classroom.routes");
const topicRoutes = require("./routes/topic.routes");
const campusPostRoutes = require("./routes/campusPost.routes");
const assessmentRoutes = require("./routes/assessment.routes");
const supportCaseRoutes = require("./routes/supportCase.routes");
const enrollmentRoutes = require("./routes/enrollment.routes");
const settingsRoutes = require("./routes/settings.routes");

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/daily-updates", dailyUpdateRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/campus-posts", campusPostRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/support-cases", supportCaseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/settings", settingsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const status = err.status || (err.code === 11000 ? 409 : ['ValidationError', 'CastError'].includes(err.name) ? 400 : 500);
  res.status(status).json({
    success: false,
    message: status >= 500 ? "Internal Server Error" : (err.message || "Request failed"),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});


module.exports = app;
