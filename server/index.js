require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = async () => {
  const conn = require("./config/db");
  await conn();
};

const app = express();

// Middleware
// CLIENT_URL: comma-separated list of allowed frontend origins. Unset = allow all (local dev).
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map(o => o.trim().replace(/\/$/, ""))
  : null;
app.use(cors(allowedOrigins ? { origin: allowedOrigins } : {}));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/claims", require("./routes/claims"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/matches", require("./routes/matches"));

// Basic welcome route
app.get("/", (req, res) => {
  res.send("CampusTrace AI-Powered Lost & Found API is running!");
});

// Lightweight health check for uptime monitors / keep-alive pings
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 5000;

// Connect to Database first, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Database connection failed, server not started:", err);
});
