const mongoose = require("mongoose");
const logger = require("../utils/logger");
const { setDbReady } = require("../services/storageService");

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    logger.warn("MONGODB_URI not set. Using in-memory storage.");
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    setDbReady(true);
    logger.info(`MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });
  } catch (error) {
    logger.warn(`MongoDB not available (${error.message}). Using in-memory storage.`);
  }
};

module.exports = connectDB;
