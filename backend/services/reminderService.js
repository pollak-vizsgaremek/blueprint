import prisma from "../config/database.js";
import { createBulkNotifications } from "./notificationService.js";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const WINDOW_TOLERANCE_MS = 5 * 60 * 1000;
const DEDUPE_LOOKBACK_MS = 26 * 60 * 60 * 1000;

let intervalId = null;
let isRunning = false;

const buildWindow = (now = new Date()) => {
  const target = new Date(now.getTime() + TWENTY_FOUR_HOURS_MS);

  return {
    from: new Date(target.getTime() - WINDOW_TOLERANCE_MS),
    to: new Date(target.getTime() + WINDOW_TOLERANCE_MS),
  };
};

const getRecentReminderKeys = async (candidateEntries, now) => {
  if (candidateEntries.length === 0) {
    return new Set();
  }

  const recent = await prisma.notification.findMany({
    where: {
      createdAt: {
        gte: new Date(now.getTime() - DEDUPE_LOOKBACK_MS),
      },
      OR: candidateEntries.map((entry) => ({
        userId: entry.userId,
        title: entry.title,
        url: entry.url,
      })),
    },
    select: {
      userId: true,
      title: true,
      url: true,
    },
  });

  return new Set(
    recent.map((entry) => `${entry.userId}:${entry.title}:${entry.url ?? ""}`),
  );
};

const createEventReminderCandidates = async (from, to) => {
  const registrations = await prisma.registration.findMany({
    where: {
      status: "registered",
      event: {
        deletedAt: null,
        date: {
          gte: from,
          lte: to,
        },
      },
    },
    select: {
      userId: true,
      event: {
        select: {
          id: true,
          name: true,
          date: true,
        },
      },
    },
  });

  return registrations.map((registration) => {
    const eventDateLabel = new Date(registration.event.date).toLocaleString(
      "hu-HU",
    );

    return {
      userId: registration.userId,
      title: "Emlékeztető: közelgő esemény",
      message: `${registration.event.name} - ${eventDateLabel}`,
      url: `/events/${registration.event.id}/details?reminder=24h`,
      type: "info",
      category: "reminders",
    };
  });
};

const createAppointmentReminderCandidates = async (from, to) => {
  const appointments = await prisma.teacherReservation.findMany({
    where: {
      status: {
        in: ["pending", "confirmed"],
      },
      startTime: {
        gte: from,
        lte: to,
      },
    },
    select: {
      id: true,
      studentId: true,
      purpose: true,
      startTime: true,
      teacher: {
        select: {
          name: true,
        },
      },
    },
  });

  return appointments.map((appointment) => {
    const appointmentTimeLabel = new Date(appointment.startTime).toLocaleString(
      "hu-HU",
    );

    return {
      userId: appointment.studentId,
      title: "Emlékeztető: közelgő időpont",
      message: `${appointment.purpose || "Időpont"} - ${appointment.teacher?.name || "tanár"} - ${appointmentTimeLabel}`,
      url: `/appointments?reminder=24h&appointmentId=${appointment.id}`,
      type: "info",
      category: "reminders",
    };
  });
};

export const runReminderSweep = async (now = new Date()) => {
  const { from, to } = buildWindow(now);
  const [eventCandidates, appointmentCandidates] = await Promise.all([
    createEventReminderCandidates(from, to),
    createAppointmentReminderCandidates(from, to),
  ]);

  const candidates = [...eventCandidates, ...appointmentCandidates];
  if (candidates.length === 0) {
    return { created: 0, scanned: 0 };
  }

  const existingKeys = await getRecentReminderKeys(candidates, now);
  const filtered = candidates.filter((entry) => {
    const key = `${entry.userId}:${entry.title}:${entry.url ?? ""}`;
    return !existingKeys.has(key);
  });

  if (filtered.length === 0) {
    return { created: 0, scanned: candidates.length };
  }

  const result = await createBulkNotifications(filtered);
  return { created: result.count ?? 0, scanned: candidates.length };
};

export const startReminderScheduler = () => {
  if (intervalId) {
    return;
  }

  intervalId = setInterval(async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    try {
      await runReminderSweep();
    } catch (error) {
      console.error("Reminder sweep failed:", error);
    } finally {
      isRunning = false;
    }
  }, FIVE_MINUTES_MS);
};
