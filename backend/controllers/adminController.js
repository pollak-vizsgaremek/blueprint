import bcrypt from "bcrypt";
import prisma from "../config/database.js";
import { deleteEventImageFromMinio } from "../middleware/upload.js";

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

export const createEvent = async (req, res) => {
  let { name, description, location, date, maxParticipants } = req.body;

  try {
    const creator = req.user.name;

    // Validate required fields
    if (!name || !description || !location || !date) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name, description, location, and date are required",
      });
    }

    // Convert maxParticipants to integer if it's a string
    if (
      maxParticipants !== undefined &&
      maxParticipants !== null &&
      maxParticipants !== ""
    ) {
      maxParticipants = parseInt(maxParticipants, 10);

      // Validate maxParticipants after conversion
      if (isNaN(maxParticipants) || maxParticipants <= 0) {
        return res.status(400).json({
          error: "Invalid maxParticipants",
          message: "Maximum participants must be a positive integer",
        });
      }
    } else {
      maxParticipants = null;
    }

    // Get image URL from uploaded file if available
    const imageUrl = req.uploadedImage ? req.uploadedImage.url : null;

    const newEvent = await prisma.event.create({
      data: {
        name,
        description,
        imageUrl,
        creator,
        location,
        date: new Date(date),
        maxParticipants: maxParticipants || null,
      },
    });

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);

    // If there was an uploaded image but database creation failed, clean it up
    if (req.uploadedImage) {
      deleteEventImageFromMinio(req.uploadedImage.url);
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update an existing event
export const updateEvent = async (req, res) => {
  const { eventId } = req.params;
  let { name, description, location, date, maxParticipants } = req.body;

  try {
    // Check if event exists
    const existingEvent = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
    });

    if (!existingEvent) {
      // Clean up uploaded image if event doesn't exist
      if (req.uploadedImage) {
        deleteEventImageFromMinio(req.uploadedImage.url);
      }
      return res.status(404).json({ error: "Event not found" });
    }

    // Convert and validate maxParticipants if provided
    if (
      maxParticipants !== undefined &&
      maxParticipants !== null &&
      maxParticipants !== ""
    ) {
      maxParticipants = parseInt(maxParticipants, 10);

      // Validate maxParticipants after conversion
      if (isNaN(maxParticipants) || maxParticipants <= 0) {
        if (req.uploadedImage) {
          deleteEventImageFromMinio(req.uploadedImage.url);
        }
        return res.status(400).json({
          error: "Invalid maxParticipants",
          message: "Maximum participants must be a positive integer",
        });
      }
    } else if (maxParticipants === "" || maxParticipants === null) {
      maxParticipants = null;
    }

    // Prepare update data
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (date !== undefined) updateData.date = new Date(date);
    if (maxParticipants !== undefined)
      updateData.maxParticipants = maxParticipants || null;

    // Handle image update
    if (req.uploadedImage) {
      // Delete old image if it exists
      if (existingEvent.imageUrl) {
        deleteEventImageFromMinio(existingEvent.imageUrl);
      }
      updateData.imageUrl = req.uploadedImage.url;
    }

    const updatedEvent = await prisma.event.update({
      where: { id: parseInt(eventId) },
      data: updateData,
    });

    res.json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Error updating event:", error);

    // Clean up uploaded image if update failed
    if (req.uploadedImage) {
      deleteEventImageFromMinio(req.uploadedImage.url);
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete an event
export const deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  try {
    // Check if event exists and get image URL
    const existingEvent = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
    });

    if (!existingEvent) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Delete the event (this will cascade delete registrations)
    await prisma.event.delete({
      where: { id: parseInt(eventId) },
    });

    // Delete associated image from MinIO if it exists
    if (existingEvent.imageUrl) {
      deleteEventImageFromMinio(existingEvent.imageUrl);
    }

    res.json({
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
