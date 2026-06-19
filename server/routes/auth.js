const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "campustrace_super_secret_jwt_key_2026";

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    user = new User({
      name,
      email,
      password,
      role: role || "user",
    });

    await user.save();

    const payload = {
      id: user.id,
      role: user.role,
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err;
      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const payload = {
      id: user.id,
      role: user.role,
    };

    jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).send("Server error");
  }
});

// @route   GET api/auth/me
// @desc    Get current user profile
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.json(user);
  } catch (err) {
    console.error("Auth profile error:", err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
