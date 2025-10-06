import prisma from "../config/database.js";

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
