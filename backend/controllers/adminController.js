import bcrypt from "bcrypt";
import prisma from "../config/database.js";

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
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const targetUserId = parseInt(id);

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

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, dateOfBirth } = req.body;
  try {
    const targetUserId = parseInt(id);

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

    // Only proceed with update if there's data to update
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        message: "Please provide at least one field to update",
      });
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: {
        name: name ?? undefined,
        email: email ?? undefined,
        dateOfBirth: new Date(dateOfBirth) ?? undefined,
        password: (await bcrypt.hash(password, 10)) ?? undefined,
      },
    });

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};
