const mongoose = require("mongoose");
const dotenv = require("dotenv");
const logger = require("./utils/logger");
dotenv.config();
const app = require("./app");

// Database connection with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info("MongoDB connected successfully");

    // Create indexes
    for (const name of ['Attendance', 'DailyUpdate', 'User', 'Topic', 'CampusPost', 'Assessment', 'AssessmentResult', 'SupportCase', 'EnrollmentRequest']) {
      await mongoose.model(name).createIndexes();
    }
  } catch (error) {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;
let server;
connectDB().then(() => {
  server = app.listen(PORT, () => logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`));
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM signal received: closing HTTP server");
  if (server) await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  process.exit(0);
});
