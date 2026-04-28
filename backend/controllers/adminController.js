import bcrypt from "bcrypt";
import prisma from "../config/database.js";
import { deleteEventImageFromMinio } from "../middleware/upload.js";
import { findMatchingAvailabilitySlot } from "../services/teacherAvailabilityService.js";

const getTeacherClassroom = async (teacherId) => {
  const teacher = await prisma.user.findUnique({
    where: { id: Number(teacherId) },
    select: { id: true, role: true, classroom: true },
  });

  if (!teacher || teacher.role !== "teacher") {
    return null;
  }

  return teacher.classroom ?? null;
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    // Format dateOfBirth to only return the date part (YYYY-MM-DD)
    const formattedUsers = users.map(({ password: _password, ...user }) => ({
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
    const { password: _password, ...userWithoutPassword } = user;
    const formattedUser = {
      ...userWithoutPassword,
      dateOfBirth: userWithoutPassword.dateOfBirth
        ? userWithoutPassword.dateOfBirth.toISOString().slice(0, 10)
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
  const { name, email, password, dateOfBirth, role, status, emailVerified } =
    req.body;
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

    const updateData = {
      name: name ?? undefined,
      email: email ?? undefined,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      role: role ?? undefined,
      status: status ?? undefined,
      emailVerified:
        emailVerified !== undefined ? Boolean(emailVerified) : undefined,
    };

    // Only hash and update password when a new password is explicitly provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
      where: { id: targetUserId },
      data: updateData,
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    res.status(200).json({
      message: "User updated successfully",
      user: {
        ...userWithoutPassword,
        dateOfBirth: userWithoutPassword.dateOfBirth
          ? userWithoutPassword.dateOfBirth.toISOString().slice(0, 10)
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createAdminUser = async (req, res) => {
  const { name, email, password, dateOfBirth, role, status, emailVerified } =
    req.body;
  try {
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Name, email and password are required",
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
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
        role: role ?? "user",
        status: status ?? "active",
        emailVerified:
          emailVerified !== undefined ? Boolean(emailVerified) : false,
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json({
      message: "User created successfully",
      user: {
        ...userWithoutPassword,
        dateOfBirth: userWithoutPassword.dateOfBirth
          ? userWithoutPassword.dateOfBirth.toISOString().slice(0, 10)
          : null,
      },
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const appointments = await prisma.teacherReservation.findMany({
      include: {
        teacher: {
          select: { id: true, name: true, email: true, role: true },
        },
        student: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const mapped = appointments.map((a) => ({
      id: a.id,
      teacherId: a.teacherId,
      studentId: a.studentId,
      title: a.purpose ?? "",
      purpose: a.purpose,
      status: a.status,
      startTime: a.startTime,
      endTime: a.endTime,
      classroom: a.classroom ?? null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      teacher: a.teacher,
      student: a.student,
    }));

    res.json({
      message: "Appointments retrieved successfully",
      appointments: mapped,
    });
  } catch (error) {
    console.error("Error fetching all appointments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createAdminAppointment = async (req, res) => {
  const { teacherId, studentId, title, startTime, endTime, status } = req.body;
  try {
    if (!teacherId || !studentId || !title || !startTime || !endTime) {
      return res.status(400).json({
        error: "Missing required fields",
        message:
          "teacherId, studentId, title, startTime and endTime are required",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "endTime must be after startTime and both must be valid dates",
      });
    }

    const availability = await findMatchingAvailabilitySlot({
      teacherId: Number(teacherId),
      startTime: start,
      endTime: end,
    });

    if (!availability) {
      return res.status(400).json({
        error: "Invalid availability",
        message:
          "The selected time does not match an available weekly teacher slot",
      });
    }

    const classroom = await getTeacherClassroom(teacherId);
    if (classroom === null) {
      const teacherExists = await prisma.user.findUnique({
        where: { id: Number(teacherId) },
        select: { id: true, role: true },
      });
      if (!teacherExists || teacherExists.role !== "teacher") {
        return res.status(400).json({
          error: "Invalid teacher",
          message: "Selected user is not a teacher",
        });
      }
    }

    const appointment = await prisma.teacherReservation.create({
      data: {
        teacherId: Number(teacherId),
        studentId: Number(studentId),
        purpose: title.trim(),
        startTime: start,
        endTime: end,
        status: status ?? "pending",
        classroom,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true, role: true } },
        student: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.status(201).json({
      message: "Appointment created successfully",
      appointment: {
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
        teacher: appointment.teacher,
        student: appointment.student,
      },
    });
  } catch (error) {
    console.error("Error creating admin appointment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAdminAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  const { teacherId, studentId, title, startTime, endTime, status } = req.body;
  try {
    const id = parseInt(appointmentId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    const existing = await prisma.teacherReservation.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const updateData = {};
    if (teacherId !== undefined) updateData.teacherId = Number(teacherId);
    if (studentId !== undefined) updateData.studentId = Number(studentId);
    if (title !== undefined) updateData.purpose = title.trim();
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (status !== undefined) updateData.status = status;

    const nextTeacherId =
      updateData.teacherId !== undefined
        ? updateData.teacherId
        : existing.teacherId;
    const nextStartTime =
      updateData.startTime !== undefined
        ? updateData.startTime
        : existing.startTime;
    const nextEndTime =
      updateData.endTime !== undefined ? updateData.endTime : existing.endTime;

    const nextTeacherClassroom = await getTeacherClassroom(nextTeacherId);
    if (nextTeacherClassroom === null) {
      const teacherExists = await prisma.user.findUnique({
        where: { id: Number(nextTeacherId) },
        select: { id: true, role: true },
      });
      if (!teacherExists || teacherExists.role !== "teacher") {
        return res.status(400).json({
          error: "Invalid teacher",
          message: "Selected user is not a teacher",
        });
      }
    }
    updateData.classroom = nextTeacherClassroom;

    if (nextEndTime <= nextStartTime) {
      return res.status(400).json({
        error: "Invalid date range",
        message: "endTime must be after startTime and both must be valid dates",
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

    const updated = await prisma.teacherReservation.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { select: { id: true, name: true, email: true, role: true } },
        student: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.json({
      message: "Appointment updated successfully",
      appointment: {
        id: updated.id,
        teacherId: updated.teacherId,
        studentId: updated.studentId,
        title: updated.purpose ?? "",
        purpose: updated.purpose,
        status: updated.status,
        startTime: updated.startTime,
        endTime: updated.endTime,
        classroom: updated.classroom ?? null,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        teacher: updated.teacher,
        student: updated.student,
      },
    });
  } catch (error) {
    console.error("Error updating admin appointment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteAdminAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const id = parseInt(appointmentId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid appointment ID" });
    }

    const existing = await prisma.teacherReservation.findUnique({
      where: { id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    await prisma.teacherReservation.delete({ where: { id } });
    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting admin appointment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllNews = async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    res.json({ message: "News retrieved successfully", news });
  } catch (error) {
    console.error("Error fetching all news:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createNews = async (req, res) => {
  const { title, content, imageUrl, isPublished } = req.body;
  try {
    if (!title || !content) {
      return res.status(400).json({
        error: "Missing required fields",
        message: "Title and content are required",
      });
    }

    const shouldPublish = isPublished === true || isPublished === "true";
    const news = await prisma.news.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl?.trim() || null,
        isPublished: shouldPublish,
        publishedAt: shouldPublish ? new Date() : null,
        authorId: req.user.id,
      },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json({ message: "News created successfully", news });
  } catch (error) {
    console.error("Error creating news:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateNews = async (req, res) => {
  const { newsId } = req.params;
  const { title, content, imageUrl, isPublished } = req.body;
  try {
    const id = parseInt(newsId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid news ID" });
    }

    const existing = await prisma.news.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return res.status(404).json({ error: "News not found" });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (content !== undefined) updateData.content = content.trim();
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null;
    if (isPublished !== undefined) {
      const shouldPublish = isPublished === true || isPublished === "true";
      updateData.isPublished = shouldPublish;
      updateData.publishedAt = shouldPublish
        ? existing.isPublished
          ? existing.publishedAt
          : new Date()
        : null;
    }

    const updated = await prisma.news.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        author: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ message: "News updated successfully", news: updated });
  } catch (error) {
    console.error("Error updating news:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNews = async (req, res) => {
  const { newsId } = req.params;
  try {
    const id = parseInt(newsId, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid news ID" });
    }

    const existing = await prisma.news.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return res.status(404).json({ error: "News not found" });
    }

    await prisma.news.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    res.json({ message: "News deleted successfully" });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createAdminRegistration = async (req, res) => {
  const { eventId } = req.params;
  const { userId, status } = req.body;
  try {
    const eventIdInt = parseInt(eventId, 10);
    const userIdInt = parseInt(userId, 10);

    if (isNaN(eventIdInt) || isNaN(userIdInt)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    const existingRegistration = await prisma.registration.findFirst({
      where: { eventId: eventIdInt, userId: userIdInt },
    });

    if (existingRegistration) {
      return res
        .status(409)
        .json({ error: "User is already registered for this event" });
    }

    const registration = await prisma.registration.create({
      data: {
        eventId: eventIdInt,
        userId: userIdInt,
        status: status || "registered",
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res
      .status(201)
      .json({ message: "Registration created successfully", registration });
  } catch (error) {
    console.error("Error creating registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAdminRegistration = async (req, res) => {
  const { registrationId } = req.params;
  const { status } = req.body;
  try {
    const regIdInt = parseInt(registrationId, 10);
    if (isNaN(regIdInt)) {
      return res.status(400).json({ error: "Invalid registration ID" });
    }

    const registration = await prisma.registration.update({
      where: { id: regIdInt },
      data: { status },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.json({ message: "Registration updated successfully", registration });
  } catch (error) {
    console.error("Error updating registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteAdminRegistration = async (req, res) => {
  const { registrationId } = req.params;
  try {
    const regIdInt = parseInt(registrationId, 10);
    if (isNaN(regIdInt)) {
      return res.status(400).json({ error: "Invalid registration ID" });
    }

    await prisma.registration.delete({
      where: { id: regIdInt },
    });

    res.json({ message: "Registration deleted successfully" });
  } catch (error) {
    console.error("Error deleting registration:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAdminComment = async (req, res) => {
  const { commentId } = req.params;
  const { isDeleted, content, isVerified } = req.body;
  try {
    const commIdInt = parseInt(commentId, 10);
    if (isNaN(commIdInt)) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    const updateData = {};
    if (isDeleted !== undefined) {
      updateData.isDeleted = isDeleted;
      if (isDeleted) updateData.deletedAt = new Date();
      else updateData.deletedAt = null;
    }
    if (content !== undefined) updateData.content = content.trim();
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    const comment = await prisma.eventComment.update({
      where: { id: commIdInt },
      data: updateData,
    });

    res.json({ message: "Comment updated successfully", comment });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createEvent = async (req, res) => {
  let { name, description, location, date, maxParticipants, classroom, creator } =
    req.body;

  try {
    const normalizedCreator = typeof creator === "string" ? creator.trim() : "";
    const normalizedClassroom =
      typeof classroom === "string" ? classroom.trim() : "";

    // Validate required fields
    if (
      !name ||
      !description ||
      !location ||
      !date ||
      !normalizedCreator ||
      !normalizedClassroom
    ) {
      if (req.uploadedImage) {
        deleteEventImageFromMinio(req.uploadedImage.url);
      }

      return res.status(400).json({
        error: "Missing required fields",
        message:
          "Name, description, location, date, creator, and classroom are required",
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
        if (req.uploadedImage) {
          deleteEventImageFromMinio(req.uploadedImage.url);
        }

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
        creator: normalizedCreator,
        location,
        classroom: normalizedClassroom,
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
  let { name, description, location, date, maxParticipants, classroom } =
    req.body;

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

    if (classroom !== undefined) {
      if (!String(classroom).trim()) {
        if (req.uploadedImage) {
          deleteEventImageFromMinio(req.uploadedImage.url);
        }
        return res.status(400).json({
          error: "Invalid classroom",
          message: "Classroom cannot be empty",
        });
      }
      updateData.classroom = String(classroom).trim();
    }

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
export const getAllNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({
      message: "Notifications retrieved successfully",
      notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createNotification = async (req, res) => {
  const { userId, title, message, type, url, isRead } = req.body;
  try {
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt) || !title || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const notification = await prisma.notification.create({
      data: {
        userId: userIdInt,
        title: title.trim(),
        message: message.trim(),
        type: type || "info",
        url: url?.trim() || null,
        isRead: isRead || false,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res
      .status(201)
      .json({ message: "Notification created successfully", notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateNotification = async (req, res) => {
  const { notificationId } = req.params;
  const { userId, title, message, type, url, isRead } = req.body;
  try {
    const id = parseInt(notificationId, 10);
    if (isNaN(id))
      return res.status(400).json({ error: "Invalid notification ID" });

    const updateData = {};
    if (userId !== undefined) updateData.userId = parseInt(userId, 10);
    if (title !== undefined) updateData.title = title.trim();
    if (message !== undefined) updateData.message = message.trim();
    if (type !== undefined) updateData.type = type;
    if (url !== undefined) updateData.url = url?.trim() || null;
    if (isRead !== undefined) updateData.isRead = isRead;

    const notification = await prisma.notification.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json({ message: "Notification updated successfully", notification });
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteNotification = async (req, res) => {
  const { notificationId } = req.params;
  try {
    const id = parseInt(notificationId, 10);
    if (isNaN(id))
      return res.status(400).json({ error: "Invalid notification ID" });

    await prisma.notification.delete({ where: { id } });
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
