const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      console.log("MONGODB_URI not found in env. Starting MongoMemoryServer...");
      const mongoServer = await MongoMemoryServer.create();
      uri = mongoServer.getUri();
      console.log("MongoMemoryServer started at:", uri);
    }
    
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully!");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
