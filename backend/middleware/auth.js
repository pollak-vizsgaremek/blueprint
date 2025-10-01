import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";

// Helper function to verify user exists in database (for critical operations)
export const verifyUserInDatabase = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        dateOfBirth: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Error verifying user in database:", error);
    return null;
  }
};

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.toISOString().slice(0, 10)
      : null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
};

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "No token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Use user info from JWT payload (no database query needed)
    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      dateOfBirth: decoded.dateOfBirth,
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

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Use user info from JWT payload (no database query needed)
    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      dateOfBirth: decoded.dateOfBirth,
    };

    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};
