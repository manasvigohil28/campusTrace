require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = async () => {
  const conn = require("./config/db");
  await conn();
};

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/items", require("./routes/items"));
app.use("/api/claims", require("./routes/claims"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/notifications", require("./routes/notifications"));

// Basic welcome route
app.get("/", (req, res) => {
  res.send("CampusTrace AI-Powered Lost & Found API is running!");
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
