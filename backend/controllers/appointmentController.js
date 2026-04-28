import prisma from "../config/database.js";
import { createBulkNotifications } from "../services/notificationService.js";
import { findMatchingAvailabilitySlot } from "../services/teacherAvailabilityService.js";

const parseDate = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isInFuture = (date) => date.getTime() > Date.now();

const normalizeTitle = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const normalizeOptionalText = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const mapAppointment = (appointment) => ({
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
});

const validateTeacher = async (teacherId) => {
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      role: true,
      classroom: true,
    },
  });

  if (!teacher || teacher.role !== "teacher") {
    return null;
  }

  return teacher;
};

const findOverlappingReservation = async ({
  teacherId,
  studentId,
  startTime,
  endTime,
  excludeId,
}) => {
  return prisma.teacherReservation.findFirst({
    where: {
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
      status: {
        in: ["pending", "confirmed"],
      },
      OR: [{ teacherId }, { studentId }],
      startTime: {
        lt: endTime,
      },
      endTime: {
        gt: startTime,
      },
    },
    select: {
      id: true,
      teacherId: true,
      studentId: true,
      startTime: true,
      endTime: true,
    },
  });
};

export const getCurrentUserAppointments = async (req, res) => {
  const userId = req.user.id;

  try {
    const appointments = await prisma.teacherReservation.findMany({
      where: {
        studentId: userId,
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
      },
      orderBy: {
        startTime: "asc",
      },
    });

    res.json({
      message: "Appointments retrieved successfully",
      appointments: appointments.map(mapAppointment),
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createAppointment = async (req, res) => {
  const studentId = req.user.id;
  const parsedTeacherId = parseInt(req.body?.teacherId, 10);
  const title = normalizeTitle(req.body?.title);
  const startTime = parseDate(req.body?.startTime);
  const endTime = parseDate(req.body?.endTime);

  if (Number.isNaN(parsedTeacherId)) {
    return res.status(400).json({
      error: "Invalid teacher ID",
      message: "Teacher ID must be a number",
    });
  }

  if (!title) {
    return res.status(400).json({
      error: "Invalid title",
      message: "Title is required",
    });
  }

  if (!startTime || !endTime) {
    return res.status(400).json({
      error: "Invalid date",
      message: "startTime and endTime must be valid dates",
    });
  }

  if (endTime <= startTime) {
    return res.status(400).json({
      error: "Invalid date range",
      message: "endTime must be later than startTime",
    });
  }

  if (!isInFuture(startTime) || !isInFuture(endTime)) {
    return res.status(400).json({
      error: "Invalid date range",
      message: "Appointments can only be scheduled for future times",
    });
  }

  try {
    const teacher = await validateTeacher(parsedTeacherId);

    if (!teacher) {
      return res.status(400).json({
        error: "Invalid teacher",
        message: "Selected user is not a teacher",
      });
    }

    const availability = await findMatchingAvailabilitySlot({
      teacherId: parsedTeacherId,
      startTime,
      endTime,
    });

    if (!availability) {
      return res.status(400).json({
        error: "Invalid availability",
        message:
          "The selected time does not match an available weekly teacher slot",
      });
    }

    const overlappingReservation = await findOverlappingReservation({
      teacherId: parsedTeacherId,
      studentId,
      startTime,
      endTime,
    });

    if (overlappingReservation) {
      const isTeacherConflict =
        overlappingReservation.teacherId === parsedTeacherId &&
        overlappingReservation.studentId !== studentId;

      return res.status(409).json({
        error: "Time slot is unavailable",
        message: isTeacherConflict
          ? "The selected teacher already has an overlapping appointment"
          : "You already have an overlapping appointment",
      });
    }

    const appointment = await prisma.teacherReservation.create({
      data: {
        teacherId: parsedTeacherId,
        studentId,
        startTime,
        endTime,
        purpose: title,
        classroom: teacher.classroom ?? null,
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
      },
    });

    await createBulkNotifications([
      {
        userId: studentId,
        title: "Időpont létrehozva",
        message: `Sikeresen létrehoztad az időpontot: ${appointment.purpose || "Új időpont"}`,
        url: "/appointments",
        type: "success",
        category: "appointments",
      },
      {
        userId: parsedTeacherId,
        title: "Új időpont kérés",
        message: `Új időpont kérés érkezett tőled: ${appointment.purpose || "Új időpont"}`,
        url: "/appointments",
        type: "info",
        category: "appointments",
      },
    ]);

    res.status(201).json({
      message: "Appointment created successfully",
      appointment: mapAppointment(appointment),
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Time slot is unavailable",
        message: "The selected teacher already has an appointment at this time",
      });
    }

    console.error("Error creating appointment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAppointment = async (req, res) => {
  const studentId = req.user.id;
  const appointmentId = parseInt(req.params.appointmentId, 10);

  if (Number.isNaN(appointmentId)) {
    return res.status(400).json({
      error: "Invalid appointment ID",
      message: "Appointment ID must be a number",
    });
  }

  try {
    const existing = await prisma.teacherReservation.findFirst({
      where: {
        id: appointmentId,
        studentId,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const updateData = {};

    if (req.body?.teacherId !== undefined) {
      const parsedTeacherId = parseInt(req.body.teacherId, 10);
      if (Number.isNaN(parsedTeacherId)) {
        return res.status(400).json({
          error: "Invalid teacher ID",
          message: "Teacher ID must be a number",
        });
      }

      const teacher = await validateTeacher(parsedTeacherId);
      if (!teacher) {
        return res.status(400).json({
          error: "Invalid teacher",
          message: "Selected user is not a teacher",
        });
      }

      updateData.teacherId = parsedTeacherId;
      updateData.classroom = teacher.classroom ?? null;
    }

    if (req.body?.title !== undefined) {
      const title = normalizeTitle(req.body.title);
      if (!title) {
        return res.status(400).json({
          error: "Invalid title",
          message: "Title cannot be empty",
        });
      }

      updateData.purpose = title;
    }

    if (req.body?.startTime !== undefined) {
      const parsed = parseDate(req.body.startTime);
      if (!parsed) {
        return res.status(400).json({
          error: "Invalid startTime",
          message: "startTime must be a valid date",
        });
      }
      updateData.startTime = parsed;
    }

    if (req.body?.endTime !== undefined) {
      const parsed = parseDate(req.body.endTime);
      if (!parsed) {
        return res.status(400).json({
          error: "Invalid endTime",
          message: "endTime must be a valid date",
        });
      }
      updateData.endTime = parsed;
    }

    if (req.body?.description !== undefined) {
      updateData.purpose = normalizeOptionalText(req.body.description);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: "No valid fields to update",
        message: "Please provide at least one field to update",
      });
    }

    const nextStartTime = updateData.startTime || existing.startTime;
    const nextEndTime = updateData.endTime || existing.endTime;
    const nextTeacherId = updateData.teacherId || existing.teacherId;

    if (updateData.teacherId === undefined) {
      const currentTeacher = await validateTeacher(nextTeacherId);
      updateData.classroom = currentTeacher?.classroom ?? null;
    }

    if (nextEndTime <= nextStartTime) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "endTime must be later than startTime",
      });
    }

    if (!isInFuture(nextStartTime) || !isInFuture(nextEndTime)) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "Appointments can only be scheduled for future times",
      });
    }

    const availability = await findMatchingAvailabilitySlot({
      teacherId: nextTeacherId,
      startTime: nextStartTime,
      endTime: nextEndTime,
    });

    if (!availability) {
      return res.status(400).json({
        error: "Invalid availability",
        message:
          "The selected time does not match an available weekly teacher slot",
      });
    }

    const overlappingReservation = await findOverlappingReservation({
      teacherId: nextTeacherId,
      studentId,
      startTime: nextStartTime,
      endTime: nextEndTime,
      excludeId: appointmentId,
    });

    if (overlappingReservation) {
      const isTeacherConflict =
        overlappingReservation.teacherId === nextTeacherId &&
        overlappingReservation.studentId !== studentId;

      return res.status(409).json({
        error: "Time slot is unavailable",
        message: isTeacherConflict
          ? "The selected teacher already has an overlapping appointment"
          : "You already have an overlapping appointment",
      });
    }

    const updated = await prisma.teacherReservation.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await createBulkNotifications([
      {
        userId: studentId,
        title: "Időpont frissítve",
        message: `Frissítetted az időpontot: ${updated.purpose || "Időpont"}`,
        url: "/appointments",
        type: "info",
        category: "appointments",
      },
      {
        userId: updated.teacherId,
        title: "Időpont módosítva",
        message: `Egy hozzád kapcsolódó időpont módosult: ${updated.purpose || "Időpont"}`,
        url: "/appointments",
        type: "warning",
        category: "appointments",
      },
    ]);

    res.json({
      message: "Appointment updated successfully",
      appointment: mapAppointment(updated),
    });
  } catch (error) {
    if (error?.code === "P2002") {
      return res.status(409).json({
        error: "Time slot is unavailable",
        message: "The selected teacher already has an appointment at this time",
      });
    }

    console.error("Error updating appointment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteAppointment = async (req, res) => {
  const studentId = req.user.id;
  const appointmentId = parseInt(req.params.appointmentId, 10);

  if (Number.isNaN(appointmentId)) {
    return res.status(400).json({
      error: "Invalid appointment ID",
      message: "Appointment ID must be a number",
    });
  }

  try {
    const existing = await prisma.teacherReservation.findFirst({
      where: {
        id: appointmentId,
        studentId,
      },
      select: {
        id: true,
        teacherId: true,
        purpose: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    await prisma.teacherReservation.delete({
      where: { id: appointmentId },
    });

    await createBulkNotifications([
      {
        userId: studentId,
        title: "Időpont törölve",
        message: `Törölted az időpontot: ${existing.purpose || "Időpont"}`,
        url: "/appointments",
        type: "warning",
        category: "appointments",
      },
      {
        userId: existing.teacherId,
        title: "Időpont lemondva",
        message: `Egy hozzád kapcsolódó időpont törölve lett: ${existing.purpose || "Időpont"}`,
        url: "/appointments",
        type: "warning",
        category: "appointments",
      },
    ]);

    res.json({
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
