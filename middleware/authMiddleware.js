const jwt = require("jsonwebtoken");
const { getIsConnected } = require("../config/db");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const dbUp = getIsConnected();

      if (dbUp) {
        // DB is available - look up real user
        const User = require("../models/User");
        req.user = await User.findById(decoded.id).select("-otp -otpExpires");
        if (!req.user) {
          return res.status(401).json({ message: "Not authorized, user not found" });
        }
      } else {
        // Fallback mode - use token payload directly
        req.user = {
          _id: decoded.id,
          email: decoded.email || "admin@legalassoc.com",
          role: decoded.role || "admin",
        };
      }

      next();
    } catch (error) {
      console.error("Token verification failed:", error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token provided" });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized as an admin" });
  }
};

// Allows both admin and editor roles
const editorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === "admin" || req.user.role === "editor")) {
    next();
  } else {
    res.status(403).json({ message: "Not authorized. Editor or Admin role required." });
  }
};

// Editor role only — used for commissioner rotation (admin cannot assign)
const editorOnly = (req, res, next) => {
  if (req.user && req.user.role === "editor") {
    next();
  } else {
    res.status(403).json({ message: "Not authorized. Only editors can assign commissioners." });
  }
};

module.exports = { protect, adminOnly, editorOrAdmin, editorOnly };
