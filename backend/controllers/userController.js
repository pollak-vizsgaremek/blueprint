import prisma from "../config/database.js";
import bcrypt from "bcrypt";
import { generateToken } from "../middleware/auth.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    // Format dateOfBirth to only return the date part (YYYY-MM-DD)
    const formattedUsers = users.map((user) => ({
      ...user,
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().slice(0, 10)
        : null,
    }));
    res.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
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

    // Return user data without password and include token
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
      token,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    // Format dateOfBirth to only return the date part (YYYY-MM-DD)
    const formattedUser = {
      ...user,
      dateOfBirth: user.dateOfBirth
        ? user.dateOfBirth.toISOString().slice(0, 10)
        : null,
    };
    res.json(formattedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const checkUserCredentials = async (req, res) => {
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

    res.json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString().slice(0, 10)
          : null,
      },
      token,
    });
  } catch (error) {
    console.error("Error checking credentials:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, dateOfBirth } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!existingUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is being updated and if it already exists
    if (email && email !== existingUser.email) {
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

    // Only update fields that are modified
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    // Only proceed with update if there's data to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        message: "Please provide at least one field to update",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
    });
    // Format dateOfBirth to only return the date part (YYYY-MM-DD)
    const formattedUser = {
      ...updatedUser,
      dateOfBirth: updatedUser.dateOfBirth
        ? updatedUser.dateOfBirth.toISOString().slice(0, 10)
        : null,
    };
    res.json(formattedUser);
  } catch (error) {
    console.error("Error updating user:", error);
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
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString().slice(0, 10)
          : null,
      },
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
