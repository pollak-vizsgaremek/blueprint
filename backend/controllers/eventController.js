import prisma from "../config/database.js";

const AI_VERIFICATION_API_KEY = process.env.AI_VERIFICATION_API_KEY;
const AI_VERIFICATION_MODEL =
  process.env.AI_VERIFICATION_MODEL || "gemini-2.0-flash";
const AI_VERIFICATION_ENDPOINT =
  process.env.AI_VERIFICATION_ENDPOINT ||
  `https://generativelanguage.googleapis.com/v1beta/models/${AI_VERIFICATION_MODEL}:generateContent`;
const AI_MODERATION_LOG_LEVEL = (
  process.env.AI_MODERATION_LOG_LEVEL || "verbose"
).toLowerCase();

const AI_KEY_SOURCE = process.env.AI_VERIFICATION_API_KEY
  ? "AI_VERIFICATION_API_KEY"
  : "none";

const shouldLogVerboseModeration =
  AI_MODERATION_LOG_LEVEL === "verbose" || AI_MODERATION_LOG_LEVEL === "debug";

const truncateForLog = (value, maxLength = 300) => {
  if (typeof value !== "string") {
    return value;
  }

  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
};

const logAIModeration = (level, message, details) => {
  const levelTag = level.toUpperCase();
  const prefix = `[AI Moderation][${levelTag}] ${message}`;

  if (level === "debug" && !shouldLogVerboseModeration) {
    return;
  }

  if (details !== undefined) {
    if (level === "warn") {
      console.warn(prefix, details);
      return;
    }

    if (level === "error") {
      console.error(prefix, details);
      return;
    }

    console.log(prefix, details);
    return;
  }

  if (level === "warn") {
    console.warn(prefix);
    return;
  }

  if (level === "error") {
    console.error(prefix);
    return;
  }

  console.log(prefix);
};

const parseJsonFromModelOutput = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    const jsonStart = value.indexOf("{");
    const jsonEnd = value.lastIndexOf("}");

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
      return null;
    }

    try {
      return JSON.parse(value.slice(jsonStart, jsonEnd + 1));
    } catch {
      return null;
    }
  }
};

const verifyCommentWithAI = async ({ content, event, userId }) => {
  const moderationRequestId = crypto.randomUUID();
  const startedAt = Date.now();

  logAIModeration("info", "Starting comment verification", {
    moderationRequestId,
    eventId: event.id,
    userId,
    contentLength: content.length,
    contentPreview: truncateForLog(content, 120),
    model: AI_VERIFICATION_MODEL,
    endpoint: AI_VERIFICATION_ENDPOINT.split("?")[0],
    keySource: AI_KEY_SOURCE,
    hasApiKey: Boolean(AI_VERIFICATION_API_KEY),
  });

  if (!AI_VERIFICATION_API_KEY) {
    logAIModeration(
      "warn",
      "Skipping verification because API key is missing",
      {
        moderationRequestId,
        eventId: event.id,
        userId,
        keySource: AI_KEY_SOURCE,
      },
    );

    return {
      isVerified: false,
      reason: "Missing AI verification API key",
      source: "skipped",
    };
  }

  try {
    const requestUrl = AI_VERIFICATION_ENDPOINT.includes("key=")
      ? AI_VERIFICATION_ENDPOINT
      : `${AI_VERIFICATION_ENDPOINT}${AI_VERIFICATION_ENDPOINT.includes("?") ? "&" : "?"}key=${encodeURIComponent(AI_VERIFICATION_API_KEY)}`;

    if (shouldLogVerboseModeration) {
      logAIModeration("debug", "Prepared Gemini moderation request", {
        moderationRequestId,
        eventId: event.id,
        userId,
        urlWithoutQuery: AI_VERIFICATION_ENDPOINT.split("?")[0],
        requestHasInlineKey: AI_VERIFICATION_ENDPOINT.includes("key="),
      });
    }

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You verify event discussion comments. Return ONLY JSON with keys isVerified (boolean) and reason (string). Mark true only for respectful, non-spam comments.",
            },
          ],
        },
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Event name: ${event.name}\nEvent description: ${event.description}\nEvent location: ${event.location}\nEvent date: ${event.date.toISOString()}\nComment: ${content}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      }),
      signal: AbortSignal.timeout(10000),
    });

    logAIModeration("info", "Gemini moderation response received", {
      moderationRequestId,
      eventId: event.id,
      userId,
      status: response.status,
      ok: response.ok,
      durationMs: Date.now() - startedAt,
    });

    if (!response.ok) {
      const errorText = await response.text();

      logAIModeration("error", "AI verification request failed", {
        moderationRequestId,
        eventId: event.id,
        userId,
        status: response.status,
        statusText: response.statusText,
        durationMs: Date.now() - startedAt,
        errorPreview: truncateForLog(errorText, 500),
      });

      return {
        isVerified: false,
        reason: "AI verification request failed",
        source: "fallback",
      };
    }

    const data = await response.json();
    const contentResult = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = parseJsonFromModelOutput(contentResult);

    if (shouldLogVerboseModeration) {
      logAIModeration("debug", "Gemini moderation raw output", {
        moderationRequestId,
        eventId: event.id,
        userId,
        outputPreview: truncateForLog(contentResult || "", 500),
      });
    }

    if (parsed && typeof parsed.isVerified === "boolean") {
      logAIModeration("info", "AI verification completed", {
        moderationRequestId,
        eventId: event.id,
        userId,
        isVerified: parsed.isVerified,
        reason:
          typeof parsed.reason === "string"
            ? truncateForLog(parsed.reason, 200)
            : "AI verification completed",
        source: "ai",
        durationMs: Date.now() - startedAt,
      });

      return {
        isVerified: parsed.isVerified,
        reason:
          typeof parsed.reason === "string"
            ? parsed.reason
            : "AI verification completed",
        source: "ai",
      };
    }

    logAIModeration("warn", "AI returned an invalid verification payload", {
      moderationRequestId,
      eventId: event.id,
      userId,
      durationMs: Date.now() - startedAt,
      outputPreview: truncateForLog(contentResult || "", 500),
    });

    return {
      isVerified: false,
      reason: "Invalid AI verification payload",
      source: "fallback",
    };
  } catch (error) {
    logAIModeration("error", "Error during AI verification", {
      moderationRequestId,
      eventId: event.id,
      userId,
      durationMs: Date.now() - startedAt,
      errorName: error?.name,
      errorMessage: error?.message,
      errorStack: shouldLogVerboseModeration
        ? truncateForLog(error?.stack || "", 1200)
        : undefined,
    });

    return {
      isVerified: false,
      reason: "AI verification error",
      source: "fallback",
    };
  }
};

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

export const getLatestPublishedNews = async (req, res) => {
  try {
    const latestNews = await prisma.news.findFirst({
      where: {
        isPublished: true,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    res.json({
      message: "Latest published news retrieved successfully",
      news: latestNews,
    });
  } catch (error) {
    console.error("Error fetching latest published news:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPublishedNews = async (req, res) => {
  try {
    const news = await prisma.news.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        content: true,
        imageUrl: true,
        publishedAt: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    res.json({
      message: "Published news retrieved successfully",
      news,
    });
  } catch (error) {
    console.error("Error fetching published news:", error);
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
            maxParticipants: true,
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

// Get comments for an event
export const getEventComments = async (req, res) => {
  const { eventId } = req.params;
  const parsedEventId = parseInt(eventId);
  const parsedLimit = req.query.limit ? parseInt(req.query.limit) : null;

  if (Number.isNaN(parsedEventId)) {
    return res.status(400).json({
      error: "Invalid event ID",
      message: "Event ID must be a number",
    });
  }

  if (parsedLimit !== null && (Number.isNaN(parsedLimit) || parsedLimit <= 0)) {
    return res.status(400).json({
      error: "Invalid limit",
      message: "Limit must be a positive number",
    });
  }

  try {
    const requester = req.user?.id
      ? await prisma.user.findUnique({
          where: { id: req.user.id },
          select: { role: true },
        })
      : null;
    const isAdmin = requester?.role === "admin" || req.user?.role === "admin";

    const event = await prisma.event.findUnique({
      where: { id: parsedEventId },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const comments = await prisma.eventComment.findMany({
      where: {
        eventId: parsedEventId,
        ...(isAdmin ? {} : { deletedAt: null }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(parsedLimit ? { take: parsedLimit } : {}),
    });

    const formattedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      isVerified: comment.isVerified,
      deletedAt: comment.deletedAt,
      isDeleted: Boolean(comment.deletedAt),
      canDelete: isAdmin || comment.userId === req.user.id,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user,
    }));

    res.json({
      message: "Event comments retrieved successfully",
      event,
      comments: formattedComments,
    });
  } catch (error) {
    console.error("Error fetching event comments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create a comment for an event
export const createEventComment = async (req, res) => {
  const { eventId } = req.params;
  const parsedEventId = parseInt(eventId);
  const userId = req.user.id;
  const content = req.body?.content?.trim();
  const createCommentRequestId = crypto.randomUUID();

  logAIModeration("info", "Incoming create comment request", {
    createCommentRequestId,
    eventId: parsedEventId,
    userId,
    contentLength: content?.length || 0,
    contentPreview: truncateForLog(content || "", 120),
  });

  if (Number.isNaN(parsedEventId)) {
    return res.status(400).json({
      error: "Invalid event ID",
      message: "Event ID must be a number",
    });
  }

  if (!content) {
    return res.status(400).json({
      error: "Invalid content",
      message: "Comment content is required",
    });
  }

  if (content.length > 2000) {
    return res.status(400).json({
      error: "Invalid content",
      message: "Comment cannot be longer than 2000 characters",
    });
  }

  try {
    const event = await prisma.event.findUnique({
      where: { id: parsedEventId },
      select: {
        id: true,
        name: true,
        description: true,
        location: true,
        date: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    const verification = await verifyCommentWithAI({
      content,
      event,
      userId,
    });

    logAIModeration("info", "Verification decision ready for comment", {
      createCommentRequestId,
      eventId: parsedEventId,
      userId,
      isVerified: verification.isVerified,
      source: verification.source,
      reason: truncateForLog(verification.reason, 200),
    });

    const shouldHideComment = !verification.isVerified;
    const hiddenAt = shouldHideComment ? new Date() : null;

    const comment = await prisma.eventComment.create({
      data: {
        eventId: parsedEventId,
        userId,
        content,
        isVerified: verification.isVerified,
        deletedAt: hiddenAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logAIModeration("info", "Comment persisted", {
      createCommentRequestId,
      eventId: parsedEventId,
      userId,
      commentId: comment.id,
      isVerified: comment.isVerified,
      isDeleted: Boolean(comment.deletedAt),
    });

    if (comment.deletedAt) {
      logAIModeration("warn", "Comment auto-hidden by moderation", {
        createCommentRequestId,
        eventId: parsedEventId,
        userId,
        commentId: comment.id,
        source: verification.source,
        reason: truncateForLog(verification.reason, 200),
      });
    }

    res.status(201).json({
      message: comment.deletedAt
        ? "Comment hidden by moderation"
        : "Comment created successfully",
      comment: {
        id: comment.id,
        content: comment.content,
        isVerified: comment.isVerified,
        deletedAt: comment.deletedAt,
        isDeleted: Boolean(comment.deletedAt),
        canDelete: true,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        user: comment.user,
      },
      verification: {
        isVerified: verification.isVerified,
        reason: verification.reason,
        source: verification.source,
      },
    });
  } catch (error) {
    console.error("Error creating event comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a comment from an event
export const deleteEventComment = async (req, res) => {
  const { eventId, commentId } = req.params;
  const parsedEventId = parseInt(eventId);
  const parsedCommentId = parseInt(commentId);
  const userId = req.user.id;

  if (Number.isNaN(parsedEventId) || Number.isNaN(parsedCommentId)) {
    return res.status(400).json({
      error: "Invalid ID",
      message: "Event ID and comment ID must be numbers",
    });
  }

  try {
    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const comment = await prisma.eventComment.findFirst({
      where: {
        id: parsedCommentId,
        eventId: parsedEventId,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const isAdmin = requester?.role === "admin" || req.user.role === "admin";
    const isOwner = comment.userId === userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You can only delete your own comments",
      });
    }

    await prisma.eventComment.update({
      where: {
        id: parsedCommentId,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    res.json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting event comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
