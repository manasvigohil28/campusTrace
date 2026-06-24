const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "campustrace_super_secret_jwt_key_2026";

const auth = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token, authorization denied." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id and role

    // Check user status in DB
    const dbUser = await User.findById(decoded.id);
    if (!dbUser) {
      return res.status(401).json({ message: "User no longer exists." });
    }

    if (dbUser.status === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended by an administrator." });
    }
    if (dbUser.status === "banned") {
      return res.status(403).json({ message: "Your account has been permanently banned." });
    }

    // Sync actual role in case it was updated
    req.user.role = dbUser.role;
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid." });
  }
};

const optionalAuth = async (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      
      const dbUser = await User.findById(decoded.id);
      if (dbUser && dbUser.status !== "suspended" && dbUser.status !== "banned") {
        req.user.role = dbUser.role;
      } else {
        req.user = null;
      }
    } catch (error) {
      // Ignore invalid/expired token, proceed as guest
    }
  }
  next();
};

const admin = (req, res, next) => {
  if (!req.user || (req.user.role !== "admin" && req.user.role !== "super-admin")) {
    return res.status(403).json({ message: "Access denied. Admin role required." });
  }
  next();
};

const superAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "super-admin") {
    return res.status(403).json({ message: "Access denied. Super Admin role required." });
  }
  next();
};

module.exports = { auth, admin, optionalAuth, superAdmin };
