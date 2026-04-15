import prisma from "../config/database.js";
import bcrypt from "bcrypt";
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

export const createUser = async (req, res) => {
  const { name, email, password, dateOfBirth } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(409).json({
        error: "Email already exists",
        message: "A user with this email address is already registered",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    // Generate JWT token for the new user
    const token = generateToken(newUser);

    // Set token as httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;
    // Format dateOfBirth to only return the date part (YYYY-MM-DD)
    const formattedUser = {
      ...userWithoutPassword,
      dateOfBirth: userWithoutPassword.dateOfBirth
        ? userWithoutPassword.dateOfBirth.toISOString().slice(0, 10)
        : null,
    };
    res.status(201).json({
      message: "User created successfully",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const userLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set token as httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    res.json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        role: user.isAdmin ? "admin" : "user",
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString().slice(0, 10)
          : null,
      },
    });
  } catch (error) {
    console.error("Error checking credentials:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get current user profile (protected route)
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is populated by the authenticateToken middleware
    const user = req.user;
    res.json({
      message: "Profile retrieved successfully",
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        dateOfBirth: user.dateOfBirth,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Logout user by clearing the token cookie
export const userLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateCurrentUser = async (req, res) => {
  const { name, email, password, dateOfBirth } = req.body;
  try {
    // req.user is populated by the authenticateToken middleware
    const user = req.user;

    if (email && email !== user.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      });
      if (emailTaken) {
        return res.status(409).json({
          error: "Email already exists",
          message: "A user with this email address is already registered",
        });
      }
    }

    // Only proceed with update if there's data to update
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        message: "Please provide at least one field to update",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name ?? undefined,
        email: email ?? undefined,
        dateOfBirth: dateOfBirth
          ? new Date(dateOfBirth) ?? undefined
          : undefined,
        password: (await bcrypt.hash(password, 10)) ?? undefined,
      },
    });

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
