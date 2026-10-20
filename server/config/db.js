const mongoose = require("mongoose");
const seedDB = require("./seed");
const ensureAdmin = require("./ensureAdmin");

const isProduction = process.env.NODE_ENV === "production";

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      // Never fall back to a throwaway in-memory DB in production — data would be wiped on every restart
      if (isProduction) {
        throw new Error("MONGODB_URI is required when NODE_ENV=production");
      }
      console.log("MONGODB_URI not found in env. Starting MongoMemoryServer...");
      // Required lazily so production installs don't need this dev-only package
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log("MongoMemoryServer started at:", uri);
    }

    await mongoose.connect(uri);
    console.log("MongoDB connected successfully!");

    // Seed the database (always in development; in production only when SEED_DB=true)
    if (!isProduction || process.env.SEED_DB === "true") {
      await seedDB();
    }

    await ensureAdmin();
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
