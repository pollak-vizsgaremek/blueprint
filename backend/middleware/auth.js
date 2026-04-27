import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  // Try to get token from cookie first, then fallback to Authorization header
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        settingJson: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        error: "Access denied",
        message: "User not found",
      });
    }

    // Use JWT payload plus current role from database for up-to-date authorization
    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: dbUser.role,
      isAdmin: dbUser.role === "admin",
      dateOfBirth: decoded.dateOfBirth,
      settingJson: dbUser.settingJson,
    };

    // Add user info to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Token has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid token",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: "Error verifying token",
    });
  }
};

// Middleware to verify admin JWT token
export const authenticateAdminToken = async (req, res, next) => {
  // Try to get token from cookie first, then fallback to Authorization header
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "No admin token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        error: "Access denied",
        message: "User not found",
      });
    }

    // Check if user is admin
    if (dbUser.role !== "admin") {
      return res.status(403).json({
        error: "Access denied",
        message: "Admin privileges required",
      });
    }

    // Use user info from JWT payload
    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: dbUser.role,
      isAdmin: dbUser.role === "admin",
      dateOfBirth: decoded.dateOfBirth,
    };

    // Add user info to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Admin token has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid admin token",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: "Error verifying admin token",
    });
  }
};
