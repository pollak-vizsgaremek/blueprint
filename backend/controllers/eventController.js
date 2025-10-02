import prisma from "../config/database.js";
import { deleteEventImageFromMinio } from "../middleware/upload.js";

export const getAllEvents = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;

    const events = await prisma.event.findMany({
      include: {
        registrations: userId
          ? {
              where: {
                userId: userId,
                status: "registered", // Only include active registrations
              },
              select: {
                id: true,
                registeredAt: true,
                status: true,
              },
            }
          : false,
        _count: {
          select: {
            registrations: {
              where: {
                status: "registered", // Only count active registrations
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const formattedEvents = events.map((event) => {
      return {
        id: event.id,
        name: event.name,
        description: event.description,
        imageUrl: event.imageUrl,
        creator: event.creator,
        location: event.location,
        date: event.date,
        maxParticipants: event.maxParticipants,
        createdAt: event.createdAt,
        registrationCount: event._count.registrations,
        userRegistration:
          userId && event.registrations.length > 0
            ? event.registrations[0]
            : null,
        isUserRegistered: userId ? event.registrations.length > 0 : false,
        isFull: event.maxParticipants
          ? event._count.registrations >= event.maxParticipants
          : false,
      };
    });

    res.json(formattedEvents);
  } catch (error) {
    console.error("Error fetching events:", error);
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

// Register user for an event
export const registerForEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    // Check if event exists and get current registration count
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                status: "registered", // Only count active registrations
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if event has reached maximum participants
    if (
      event.maxParticipants &&
      event._count.registrations >= event.maxParticipants
    ) {
      return res.status(409).json({
        error: "Event full",
        message: `This event has reached its maximum capacity of ${event.maxParticipants} participants`,
      });
    }

    // Check if user is already registered
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: parseInt(eventId),
        },
      },
    });

    if (existingRegistration) {
      if (existingRegistration.status === "registered") {
        return res.status(409).json({
          error: "Already registered",
          message: "You are already registered for this event",
        });
      } else if (existingRegistration.status === "cancelled") {
        // Check capacity again before re-registering
        if (
          event.maxParticipants &&
          event._count.registrations >= event.maxParticipants
        ) {
          return res.status(409).json({
            error: "Event full",
            message: `This event has reached its maximum capacity of ${event.maxParticipants} participants`,
          });
        }

        // Reactivate the cancelled registration
        const registration = await prisma.registration.update({
          where: {
            userId_eventId: {
              userId: userId,
              eventId: parseInt(eventId),
            },
          },
          data: {
            status: "registered",
            registeredAt: new Date(), // Update registration time
          },
        });

        return res.status(200).json({
          message: "Successfully re-registered for event",
          registration: {
            id: registration.id,
            eventId: registration.eventId,
            registeredAt: registration.registeredAt,
            status: registration.status,
          },
        });
      }
    }

    // Create new registration
    const registration = await prisma.registration.create({
      data: {
        userId: userId,
        eventId: parseInt(eventId),
      },
    });

    res.status(201).json({
      message: "Successfully registered for event",
      registration: {
        id: registration.id,
        eventId: registration.eventId,
        registeredAt: registration.registeredAt,
        status: registration.status,
      },
    });
  } catch (error) {
    console.error("Error registering for event:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Unregister user from an event
export const unregisterFromEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    // Check if registration exists and is active
    const registration = await prisma.registration.findUnique({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: parseInt(eventId),
        },
      },
    });

    if (!registration) {
      return res.status(404).json({
        error: "Registration not found",
        message: "You are not registered for this event",
      });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({
        error: "Registration already cancelled",
        message: "Your registration for this event is already cancelled",
      });
    }

    // Update registration status to cancelled instead of deleting
    await prisma.registration.update({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: parseInt(eventId),
        },
      },
      data: {
        status: "cancelled",
      },
    });

    res.json({
      message: "Successfully cancelled registration for event",
    });
  } catch (error) {
    console.error("Error cancelling registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get user's event registrations
export const getUserEventRegistrations = async (req, res) => {
  const userId = req.user.id;

  try {
    const registrations = await prisma.registration.findMany({
      where: { userId: userId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            description: true,
            imageUrl: true,
            creator: true,
            location: true,
            date: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        registeredAt: "desc",
      },
    });

    const formattedRegistrations = registrations.map((reg) => {
      return {
        id: reg.id,
        registeredAt: reg.registeredAt,
        status: reg.status,
        event: reg.event,
      };
    });

    res.json({
      message: "Registrations retrieved successfully",
      registrations: formattedRegistrations,
    });
  } catch (error) {
    console.error("Error fetching user registrations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get event registrations (for event organizers/admin)
export const getEventRegistrations = async (req, res) => {
  const { eventId } = req.params;

  try {
    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: parseInt(eventId) },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId: parseInt(eventId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        registeredAt: "desc",
      },
    });

    const formattedRegistrations = registrations.map((reg) => ({
      id: reg.id,
      registeredAt: reg.registeredAt,
      status: reg.status,
      user: reg.user,
    }));

    res.json({
      message: "Event registrations retrieved successfully",
      event: {
        id: event.id,
        name: event.name,
      },
      registrations: formattedRegistrations,
    });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
