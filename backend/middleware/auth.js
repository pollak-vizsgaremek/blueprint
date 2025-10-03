import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "your-super-secret-jwt-key-change-this-in-production";

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.isAdmin ? "admin" : "user",
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.toISOString().slice(0, 10)
      : null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
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
      role: decoded.role,
      isAdmin: decoded.role === "admin",
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

// Middleware to verify admin JWT token
export const authenticateAdminToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: "Access denied",
      message: "No admin token provided",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user is admin
    if (decoded.role !== "admin") {
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
      role: decoded.role,
      isAdmin: decoded.role === "admin",
      dateOfBirth: decoded.dateOfBirth,
    };

    // Add user info to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Admin token verification error:", error);

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

export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Use user info from JWT payload
    const user = {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
      isAdmin: decoded.role === "admin",
      dateOfBirth: decoded.dateOfBirth,
    };

    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};
