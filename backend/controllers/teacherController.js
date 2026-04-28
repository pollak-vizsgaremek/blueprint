import prisma from "../config/database.js";
import { deleteEventImageFromMinio } from "../middleware/upload.js";
import { validateAvailabilityPayload } from "../services/teacherAvailabilityService.js";

const appointmentStatusValues = [
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

const mapTeacherAppointment = (appointment) => ({
  id: appointment.id,
  teacherId: appointment.teacherId,
  studentId: appointment.studentId,
  title: appointment.purpose ?? "",
  purpose: appointment.purpose,
  status: appointment.status,
  startTime: appointment.startTime,
  endTime: appointment.endTime,
  classroom: appointment.classroom ?? null,
  createdAt: appointment.createdAt,
  updatedAt: appointment.updatedAt,
  teacher: appointment.teacher
    ? {
        id: appointment.teacher.id,
        name: appointment.teacher.name,
        email: appointment.teacher.email,
        role: appointment.teacher.role,
      }
    : null,
  student: appointment.student
    ? {
        id: appointment.student.id,
        name: appointment.student.name,
        email: appointment.student.email,
        role: appointment.student.role,
      }
    : null,
});

export const getTeacherProfile = async (req, res) => {
  const teacherId = req.user.id;

  try {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        classroom: true,
      },
    });

    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ error: "Teacher not found" });
    }

    res.json({
      message: "Teacher profile retrieved successfully",
      teacher: {
        ...teacher,
        classroom: teacher.classroom ?? null,
      },
    });
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateTeacherProfile = async (req, res) => {
  const teacherId = req.user.id;
  const classroomInput = req.body?.classroom;

  if (classroomInput === undefined) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "classroom is required",
    });
  }

  const classroom =
    typeof classroomInput === "string" ? classroomInput.trim() : "";

  try {
    const teacher = await prisma.user.update({
      where: { id: teacherId },
      data: {
        classroom: classroom.length > 0 ? classroom : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        classroom: true,
      },
    });

    res.json({
      message: "Teacher profile updated successfully",
      teacher: {
        ...teacher,
        classroom: teacher.classroom ?? null,
      },
    });
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTeacherAppointments = async (req, res) => {
  const teacherId = req.user.id;

  try {
    const appointments = await prisma.teacherReservation.findMany({
      where: {
        teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    });

    res.json({
      message: "Teacher appointments retrieved successfully",
      appointments: appointments.map(mapTeacherAppointment),
    });
  } catch (error) {
    console.error("Error fetching teacher appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateTeacherAppointmentStatus = async (req, res) => {
  const teacherId = req.user.id;
  const appointmentId = parseInt(req.params.appointmentId, 10);
  const status = req.body?.status;

  if (Number.isNaN(appointmentId)) {
    return res.status(400).json({
      error: "Invalid appointment ID",
      message: "Appointment ID must be a number",
    });
  }

  if (!appointmentStatusValues.includes(status)) {
    return res.status(400).json({
      error: "Invalid status",
      message: "Status must be one of pending, confirmed, cancelled, completed",
    });
  }

  try {
    const existing = await prisma.teacherReservation.findFirst({
      where: {
        id: appointmentId,
        teacherId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const updated = await prisma.teacherReservation.update({
      where: { id: appointmentId },
      data: { status },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    res.json({
      message: "Appointment status updated successfully",
      appointment: mapTeacherAppointment(updated),
    });
  } catch (error) {
    console.error("Error updating teacher appointment status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getOwnTeacherAvailability = async (req, res) => {
  const teacherId = req.user.id;

  try {
    const availability = await prisma.teacherAvailability.findMany({
      where: {
        teacherId,
        isActive: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
    });

    res.json({
      message: "Teacher availability retrieved successfully",
      availability,
    });
  } catch (error) {
    console.error("Error fetching own teacher availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createOwnTeacherAvailability = async (req, res) => {
  const teacherId = req.user.id;
  const dayOfWeek = parseInt(req.body?.dayOfWeek, 10);
  const startMinutes = parseInt(req.body?.startMinutes, 10);
  const endMinutes = parseInt(req.body?.endMinutes, 10);

  const validationError = validateAvailabilityPayload({
    dayOfWeek,
    startMinutes,
    endMinutes,
  });

  if (validationError) {
    return res.status(400).json(validationError);
  }

  try {
    const availability = await prisma.teacherAvailability.create({
      data: {
        teacherId,
        dayOfWeek,
        startMinutes,
        endMinutes,
      },
    });

    res.status(201).json({
      message: "Teacher availability created successfully",
      availability,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Availability already exists",
        message: "This exact availability slot already exists",
      });
    }

    console.error("Error creating own teacher availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateOwnTeacherAvailability = async (req, res) => {
  const teacherId = req.user.id;
  const availabilityId = parseInt(req.params.availabilityId, 10);

  if (Number.isNaN(availabilityId)) {
    return res.status(400).json({
      error: "Invalid availability ID",
      message: "Availability ID must be a number",
    });
  }

  try {
    const existing = await prisma.teacherAvailability.findFirst({
      where: {
        id: availabilityId,
        teacherId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Availability not found" });
    }

    const nextDayOfWeek =
      req.body?.dayOfWeek !== undefined
        ? parseInt(req.body.dayOfWeek, 10)
        : existing.dayOfWeek;
    const nextStartMinutes =
      req.body?.startMinutes !== undefined
        ? parseInt(req.body.startMinutes, 10)
        : existing.startMinutes;
    const nextEndMinutes =
      req.body?.endMinutes !== undefined
        ? parseInt(req.body.endMinutes, 10)
        : existing.endMinutes;

    const validationError = validateAvailabilityPayload({
      dayOfWeek: nextDayOfWeek,
      startMinutes: nextStartMinutes,
      endMinutes: nextEndMinutes,
    });

    if (validationError) {
      return res.status(400).json(validationError);
    }

    const updateData = {};

    if (req.body?.dayOfWeek !== undefined) {
      updateData.dayOfWeek = nextDayOfWeek;
    }

    if (req.body?.startMinutes !== undefined) {
      updateData.startMinutes = nextStartMinutes;
    }

    if (req.body?.endMinutes !== undefined) {
      updateData.endMinutes = nextEndMinutes;
    }

    if (req.body?.isActive !== undefined) {
      updateData.isActive = Boolean(req.body.isActive);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        message: "Please provide at least one field to update",
      });
    }

    const updated = await prisma.teacherAvailability.update({
      where: {
        id: availabilityId,
      },
      data: updateData,
    });

    res.json({
      message: "Teacher availability updated successfully",
      availability: updated,
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Availability already exists",
        message: "This exact availability slot already exists",
      });
    }

    console.error("Error updating own teacher availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteOwnTeacherAvailability = async (req, res) => {
  const teacherId = req.user.id;
  const availabilityId = parseInt(req.params.availabilityId, 10);

  if (Number.isNaN(availabilityId)) {
    return res.status(400).json({
      error: "Invalid availability ID",
      message: "Availability ID must be a number",
    });
  }

  try {
    const existing = await prisma.teacherAvailability.findFirst({
      where: {
        id: availabilityId,
        teacherId,
      },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: "Availability not found" });
    }

    await prisma.teacherAvailability.update({
      where: {
        id: availabilityId,
      },
      data: {
        isActive: false,
      },
    });

    res.json({
      message: "Teacher availability deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting own teacher availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTeacherCreatedEvents = async (req, res) => {
  const teacherName = req.user.name;

  try {
    const events = await prisma.event.findMany({
      where: {
        creator: teacherName,
        deletedAt: null,
      },
      include: {
        eventMap: {
          select: {
            name: true,
            imageUrl: true,
          },
        },
        _count: {
          select: {
            registrations: {
              where: {
                status: "registered",
              },
            },
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    });

    const formattedEvents = events.map((event) => ({
      id: event.id,
      name: event.name,
      description: event.description,
      imageUrl: event.imageUrl,
      creator: event.creator,
      location: event.location,
      eventMapId: event.eventMapId,
      mapImageUrl: event.eventMap?.imageUrl ?? null,
      mapName: event.eventMap?.name ?? null,
      date: event.date,
      maxParticipants: event.maxParticipants,
      createdAt: event.createdAt,
      registrationCount: event._count.registrations,
      userRegistration: null,
      isUserRegistered: false,
      isFull: event.maxParticipants
        ? event._count.registrations >= event.maxParticipants
        : false,
    }));

    res.json({
      message: "Teacher events retrieved successfully",
      events: formattedEvents,
    });
  } catch (error) {
    console.error("Error fetching teacher created events:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createTeacherEvent = async (req, res) => {
  let { name, description, location, date, maxParticipants, creator } =
    req.body;

  try {
    const normalizedCreator = typeof creator === "string" ? creator.trim() : "";

    if (!name || !description || !location || !date || !normalizedCreator) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name, description, location, date, and creator are required",
      });
    }

    if (
      maxParticipants !== undefined &&
      maxParticipants !== null &&
      maxParticipants !== ""
    ) {
      maxParticipants = parseInt(maxParticipants, 10);

      if (Number.isNaN(maxParticipants) || maxParticipants <= 0) {
        return res.status(400).json({
          error: "Invalid maxParticipants",
          message: "Maximum participants must be a positive integer",
        });
      }
    } else {
      maxParticipants = null;
    }

    const imageUrl = req.uploadedImage ? req.uploadedImage.url : null;

    const newEvent = await prisma.event.create({
      data: {
        name,
        description,
        imageUrl,
        creator: normalizedCreator,
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
    console.error("Error creating teacher event:", error);

    if (req.uploadedImage) {
      deleteEventImageFromMinio(req.uploadedImage.url);
    }

    res.status(500).json({ error: "Internal Server Error" });
  }
};
