import prisma from "../config/database.js";

export const getDayOfWeekIso = (date) => {
  const day = date.getDay();
  return day === 0 ? 7 : day;
};

export const getMinutesOfDay = (date) => {
  return date.getHours() * 60 + date.getMinutes();
};

export const validateAvailabilityPayload = ({
  dayOfWeek,
  startMinutes,
  endMinutes,
}) => {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
    return {
      error: "Invalid dayOfWeek",
      message: "dayOfWeek must be an integer between 1 and 7",
    };
  }

  if (
    !Number.isInteger(startMinutes) ||
    !Number.isInteger(endMinutes) ||
    startMinutes < 0 ||
    endMinutes > 1439
  ) {
    return {
      error: "Invalid minutes range",
      message:
        "startMinutes and endMinutes must be integers between 0 and 1439",
    };
  }

  if (startMinutes >= endMinutes) {
    return {
      error: "Invalid minutes range",
      message: "endMinutes must be greater than startMinutes",
    };
  }

  return null;
};

export const validateTeacherForAvailability = async (teacherId) => {
  const teacher = await prisma.user.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!teacher || teacher.role !== "teacher") {
    return null;
  }

  return teacher;
};

export const findMatchingAvailabilitySlot = async ({
  teacherId,
  startTime,
  endTime,
}) => {
  const dayOfWeek = getDayOfWeekIso(startTime);
  const startMinutes = getMinutesOfDay(startTime);
  const endMinutes = getMinutesOfDay(endTime);

  if (
    getDayOfWeekIso(endTime) !== dayOfWeek ||
    endMinutes <= startMinutes ||
    startTime.toDateString() !== endTime.toDateString()
  ) {
    return null;
  }

  return prisma.teacherAvailability.findFirst({
    where: {
      teacherId,
      dayOfWeek,
      startMinutes,
      endMinutes,
      isActive: true,
    },
    select: {
      id: true,
      teacherId: true,
      dayOfWeek: true,
      startMinutes: true,
      endMinutes: true,
    },
  });
};
