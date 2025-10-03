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
        isAdmin: false,
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
    const targetUserId = parseInt(id);
    const currentUserId = req.user.id;
    const isAdmin = req.user.isAdmin;

    // Authorization: Users can only view their own profile, admins can view anyone's profile
    if (!isAdmin && targetUserId !== currentUserId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only view your own profile",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
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
        role: user.isAdmin ? "admin" : "user",
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
    const targetUserId = parseInt(id);
    const currentUserId = req.user.id;
    const isAdmin = req.user.isAdmin;

    // Authorization: Users can only update themselves, admins can update anyone
    if (!isAdmin && targetUserId !== currentUserId) {
      return res.status(403).json({
        error: "Access denied",
        message: "You can only update your own profile",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: targetUserId },
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
      where: { id: targetUserId },
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
        isAdmin: user.isAdmin,
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

// Promote user to admin (admin only)
export const promoteToAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isAdmin) {
      return res.status(400).json({
        error: "User is already an admin",
        message: "This user already has admin privileges",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isAdmin: true },
    });

    // Format dateOfBirth to only return the date part (YYYY-MM-DD)
    const formattedUser = {
      ...updatedUser,
      dateOfBirth: updatedUser.dateOfBirth
        ? updatedUser.dateOfBirth.toISOString().slice(0, 10)
        : null,
    };
    delete formattedUser.password;

    res.json({
      message: "User promoted to admin successfully",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Demote user from admin (admin only)
export const demoteFromAdmin = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.isAdmin) {
      return res.status(400).json({
        error: "User is not an admin",
        message: "This user does not have admin privileges",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { isAdmin: false },
    });

    // Format dateOfBirth to only return the date part (YYYY-MM-DD)
    const formattedUser = {
      ...updatedUser,
      dateOfBirth: updatedUser.dateOfBirth
        ? updatedUser.dateOfBirth.toISOString().slice(0, 10)
        : null,
    };
    delete formattedUser.password;

    res.json({
      message: "User demoted from admin successfully",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error demoting user from admin:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
