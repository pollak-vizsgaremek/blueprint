import jwt from "jsonwebtoken";
import prisma from "../config/database.js";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

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
        status: true,
        deletedAt: true,
        classroom: true,
        settingJson: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        error: "Access denied",
        message: "User not found",
      });
    }

    if (dbUser.deletedAt || dbUser.status !== "active") {
      return res.status(403).json({
        error: "Access denied",
        message: "Account is not active",
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
      classroom: dbUser.classroom ?? null,
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
        status: true,
        deletedAt: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        error: "Access denied",
        message: "User not found",
      });
    }

    if (dbUser.deletedAt || dbUser.status !== "active") {
      return res.status(403).json({
        error: "Access denied",
        message: "Account is not active",
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

// Middleware to verify teacher JWT token
export const authenticateTeacherToken = async (req, res, next) => {
  // Try to get token from cookie first, then fallback to Authorization header
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers["authorization"];
    token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  }

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "No teacher token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!dbUser) {
      return res.status(401).json({
        error: "Access denied",
        message: "User not found",
      });
    }

    if (dbUser.deletedAt || dbUser.status !== "active") {
      return res.status(403).json({
        error: "Access denied",
        message: "Account is not active",
      });
    }

    // Check if user is teacher
    if (dbUser.role !== "teacher") {
      return res.status(403).json({
        error: "Access denied",
        message: "Teacher privileges required",
      });
    }

    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: dbUser.role,
      isAdmin: false,
      dateOfBirth: decoded.dateOfBirth,
    };

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Teacher token has expired",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Access denied",
        message: "Invalid teacher token",
      });
    }

    return res.status(500).json({
      error: "Internal server error",
      message: "Error verifying teacher token",
    });
  }
};
