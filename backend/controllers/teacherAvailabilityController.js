import prisma from "../config/database.js";
import {
  validateAvailabilityPayload,
  validateTeacherForAvailability,
} from "../services/teacherAvailabilityService.js";

export const getTeacherAvailability = async (req, res) => {
  const teacherId = parseInt(req.params.teacherId, 10);

  if (Number.isNaN(teacherId)) {
    return res.status(400).json({
      error: "Invalid teacher ID",
      message: "Teacher ID must be a number",
    });
  }

  try {
    const teacher = await validateTeacherForAvailability(teacherId);

    if (!teacher) {
      return res.status(400).json({
        error: "Invalid teacher",
        message: "Selected user is not a teacher",
      });
    }

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
    console.error("Error fetching teacher availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createTeacherAvailability = async (req, res) => {
  const teacherId = parseInt(req.body?.teacherId, 10);
  const dayOfWeek = parseInt(req.body?.dayOfWeek, 10);
  const startMinutes = parseInt(req.body?.startMinutes, 10);
  const endMinutes = parseInt(req.body?.endMinutes, 10);

  if (Number.isNaN(teacherId)) {
    return res.status(400).json({
      error: "Invalid teacher ID",
      message: "teacherId must be a number",
    });
  }

  const validationError = validateAvailabilityPayload({
    dayOfWeek,
    startMinutes,
    endMinutes,
  });

  if (validationError) {
    return res.status(400).json(validationError);
  }

  try {
    const teacher = await validateTeacherForAvailability(teacherId);

    if (!teacher) {
      return res.status(400).json({
        error: "Invalid teacher",
        message: "Selected user is not a teacher",
      });
    }

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
        message: "This exact availability slot already exists for the teacher",
      });
    }

    console.error("Error creating teacher availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateTeacherAvailability = async (req, res) => {
  const availabilityId = parseInt(req.params.availabilityId, 10);

  if (Number.isNaN(availabilityId)) {
    return res.status(400).json({
      error: "Invalid availability ID",
      message: "Availability ID must be a number",
    });
  }

  try {
    const existing = await prisma.teacherAvailability.findUnique({
      where: { id: availabilityId },
    });

    if (!existing) {
      return res.status(404).json({ error: "Availability not found" });
    }

    const updateData = {};

    if (req.body?.teacherId !== undefined) {
      const teacherId = parseInt(req.body.teacherId, 10);
      if (Number.isNaN(teacherId)) {
        return res.status(400).json({
          error: "Invalid teacher ID",
          message: "teacherId must be a number",
        });
      }

      const teacher = await validateTeacherForAvailability(teacherId);

      if (!teacher) {
        return res.status(400).json({
          error: "Invalid teacher",
          message: "Selected user is not a teacher",
        });
      }

      updateData.teacherId = teacherId;
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
      where: { id: availabilityId },
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
        message: "This exact availability slot already exists for the teacher",
      });
    }

    console.error("Error updating teacher availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteTeacherAvailability = async (req, res) => {
  const availabilityId = parseInt(req.params.availabilityId, 10);

  if (Number.isNaN(availabilityId)) {
    return res.status(400).json({
      error: "Invalid availability ID",
      message: "Availability ID must be a number",
    });
  }

  try {
    const existing = await prisma.teacherAvailability.findUnique({
      where: { id: availabilityId },
      select: {
        id: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Availability not found" });
    }

    await prisma.teacherAvailability.update({
      where: { id: availabilityId },
      data: { isActive: false },
    });

    res.json({
      message: "Teacher availability deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting teacher availability:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
