import prisma from "../config/database.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  isEmailServiceConfigured,
  sendEmailConfirmationEmail,
  sendPasswordResetEmail,
} from "../services/emailService.js";

const DEFAULT_SETTING_JSON = {
  emailReminders: true,
  eventUpdates: true,
  commentsReplies: false,
  marketingNews: false,
  showPastEvents: true,
  autoOpenEventModal: true,
  compactCalendar: false,
  reducedMotion: false,
  highContrast: false,
  weekStart: "monday",
  showWeekNumbers: false,
  defaultCalendarView: "month",
  hideCancelledAppointments: true,
};

const normalizeSettingJson = (value) => {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_SETTING_JSON };
  }

  return {
    ...DEFAULT_SETTING_JSON,
    ...value,
  };
};

const JWT_SECRET = process.env.JWT_SECRET;
const EMAIL_CONFIRM_SECRET = `${JWT_SECRET}:email-confirm`;
const PASSWORD_RESET_SECRET_PREFIX = `${JWT_SECRET}:password-reset`;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

// Generate JWT token
export const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    dateOfBirth: user.dateOfBirth
      ? user.dateOfBirth.toISOString().slice(0, 10)
      : null,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
};

const createEmailConfirmationToken = (user) => {
  return jwt.sign(
    {
      purpose: "email-confirmation",
      userId: user.id,
      email: user.email,
    },
    EMAIL_CONFIRM_SECRET,
    { expiresIn: "24h" },
  );
};

const createPasswordResetToken = (user) => {
  return jwt.sign(
    {
      purpose: "password-reset",
      userId: user.id,
    },
    `${PASSWORD_RESET_SECRET_PREFIX}:${user.password}`,
    { expiresIn: "1h" },
  );
};

const parseTokenPayload = (token) => {
  if (!token || typeof token !== "string") {
    return null;
  }

  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded !== "object") {
    return null;
  }

  return decoded;
};

export const createUser = async (req, res) => {
  const { name, email, password, dateOfBirth } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
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
      },
    });

    if (isEmailServiceConfigured()) {
      try {
        const confirmationToken = createEmailConfirmationToken(newUser);
        const emailResult = await sendEmailConfirmationEmail({
          email: newUser.email,
          name: newUser.name,
          token: confirmationToken,
        });
        console.log("[REGISTER EMAIL RESULT]", emailResult);
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    // Generate JWT token for the new user
    const token = generateToken(newUser);

    // Set token as httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    // Return user data without password
    const { password: _, ...userWithoutPassword } = newUser;
    // Format dateOfBirth to only return the date part (YYYY-MM-DD)
    const formattedUser = {
      ...userWithoutPassword,
      dateOfBirth: userWithoutPassword.dateOfBirth
        ? userWithoutPassword.dateOfBirth.toISOString().slice(0, 10)
        : null,
      classroom: userWithoutPassword.classroom ?? null,
    };
    res.status(201).json({
      message: "User created successfully",
      user: formattedUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const userLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (user.deletedAt) {
      return res.status(403).json({
        error: "Access denied",
        message: "Account is not available",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        error: "Access denied",
        message: "Account is not active",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        error: "Az email nincs megerősítve",
        code: "email_not_verified",
        message: "Az email cím még nincs megerősítve",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Set token as httpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        dateOfBirth: user.dateOfBirth
          ? user.dateOfBirth.toISOString().slice(0, 10)
          : null,
        classroom: user.classroom ?? null,
      },
    });
  } catch (error) {
    console.error("Error checking credentials:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get current user profile (protected route)
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is populated by the authenticateToken middleware
    const user = req.user;
    res.json({
      message: "Profile retrieved successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isAdmin: user.isAdmin,
        dateOfBirth: user.dateOfBirth,
        classroom: user.classroom ?? null,
        settingJson: normalizeSettingJson(user.settingJson),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTeachers = async (req, res) => {
  try {
    const teachers = await prisma.user.findMany({
      where: {
        role: "teacher",
      },
      select: {
        id: true,
        name: true,
        email: true,
        classroom: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      message: "Teachers retrieved successfully",
      teachers,
    });
  } catch (error) {
    console.error("Error fetching teachers:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUsersLite = async (req, res) => {
  try {
    const requesterRole = req.user?.role;

    if (requesterRole !== "teacher" && requesterRole !== "admin") {
      return res.status(403).json({
        error: "Forbidden",
        message: "Only teachers and admins can access this user list",
      });
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      message: "Users retrieved successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching users list:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Logout user by clearing the token cookie
export const userLogout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });
    res.json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateCurrentUser = async (req, res) => {
  const { name, email, password, dateOfBirth, classroom, settingJson } =
    req.body;
  try {
    // req.user is populated by the authenticateToken middleware
    const user = req.user;

    if (email && email !== user.email) {
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

    const isEmailChanged =
      typeof email === "string" &&
      email.trim().length > 0 &&
      email !== user.email;

    const updateData = {
      name: name ?? undefined,
      email: email ?? undefined,
      classroom:
        classroom !== undefined
          ? typeof classroom === "string"
            ? classroom.trim() || null
            : null
          : undefined,
      dateOfBirth: dateOfBirth
        ? (new Date(dateOfBirth) ?? undefined)
        : undefined,
      settingJson:
        settingJson !== undefined
          ? normalizeSettingJson(settingJson)
          : undefined,
      emailVerified: isEmailChanged ? false : undefined,
    };

    if (typeof password === "string" && password.trim().length > 0) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (Object.keys(updateData).every((key) => updateData[key] === undefined)) {
      return res.status(400).json({
        error: "No valid fields to update",
        message: "Please provide at least one field to update",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        name: true,
        email: true,
        role: true,
        classroom: true,
        dateOfBirth: true,
        settingJson: true,
      },
    });

    if (isEmailChanged && isEmailServiceConfigured()) {
      try {
        const confirmationToken = createEmailConfirmationToken({
          id: user.id,
          email: updatedUser.email,
        });
        await sendEmailConfirmationEmail({
          email: updatedUser.email,
          name: updatedUser.name,
          token: confirmationToken,
        });
      } catch (emailError) {
        console.error(
          "Failed to send confirmation email after update:",
          emailError,
        );
      }
    }

    res.status(200).json({
      message: isEmailChanged
        ? "User updated successfully. Please verify your new email address."
        : "User updated successfully",
      requiresEmailVerification: isEmailChanged,
      user: {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        classroom: updatedUser.classroom ?? null,
        dateOfBirth: updatedUser.dateOfBirth
          ? updatedUser.dateOfBirth.toISOString().slice(0, 10)
          : null,
        settingJson: normalizeSettingJson(updatedUser.settingJson),
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const requestEmailConfirmation = async (req, res) => {
  const email = req.body?.email?.trim();

  if (!email) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "Email is required",
    });
  }

  if (!isEmailServiceConfigured()) {
    return res.status(503).json({
      error: "Email szolgáltatás nem elérhető",
      message: "Az email szolgáltatás nincs beállítva",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        status: true,
        deletedAt: true,
      },
    });

    if (
      user &&
      !user.emailVerified &&
      !user.deletedAt &&
      user.status === "active"
    ) {
      const token = createEmailConfirmationToken(user);
      const emailResult = await sendEmailConfirmationEmail({
        email: user.email,
        name: user.name,
        token,
      });
      console.log("[EMAIL CONFIRMATION REQUEST RESULT]", emailResult);
    } else {
      console.log("[EMAIL CONFIRMATION REQUEST SKIPPED]", {
        reason: "Account is missing or not eligible",
      });
    }

    return res.json({
      message: "Ha létezik jogosult fiók, elküldtük a megerősítő emailt",
    });
  } catch (error) {
    console.error("Error requesting email confirmation:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const confirmEmail = async (req, res) => {
  const token = req.body?.token;

  if (!token) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "Token is required",
    });
  }

  try {
    const payload = jwt.verify(token, EMAIL_CONFIRM_SECRET);

    if (
      !payload ||
      typeof payload !== "object" ||
      payload.purpose !== "email-confirmation"
    ) {
      return res.status(400).json({
        error: "Invalid token",
        message: "Email confirmation token is invalid",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user || user.email !== payload.email) {
      return res.status(400).json({
        error: "Invalid token",
        message: "Email confirmation token is invalid",
      });
    }

    if (user.emailVerified) {
      return res.json({ message: "Email is already confirmed" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return res.json({ message: "Email confirmed successfully" });
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res.status(400).json({
        error: "Token expired",
        message: "Email confirmation token has expired",
      });
    }

    if (error?.name === "JsonWebTokenError") {
      return res.status(400).json({
        error: "Invalid token",
        message: "Email confirmation token is invalid",
      });
    }

    console.error("Error confirming email:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const requestPasswordReset = async (req, res) => {
  const email = req.body?.email?.trim();

  if (!email) {
    return res.status(400).json({
      error: "Missing required fields",
      message: "Email is required",
    });
  }

  if (!isEmailServiceConfigured()) {
    return res.status(503).json({
      error: "Email szolgáltatás nem elérhető",
      message: "Az email szolgáltatás nincs beállítva",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        status: true,
        deletedAt: true,
      },
    });

    if (user && !user.deletedAt && user.status === "active") {
      const token = createPasswordResetToken(user);
      const emailResult = await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        token,
      });
      console.log("[PASSWORD RESET REQUEST RESULT]", emailResult);
    } else {
      console.log("[PASSWORD RESET REQUEST SKIPPED]", {
        reason: "Account is missing or not eligible",
      });
    }

    return res.json({
      message:
        "Ha létezik jogosult fiók, elküldtük a jelszó-visszaállító emailt",
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  const token = req.body?.token;
  const nextPassword = req.body?.password;

  if (!token || !nextPassword || typeof nextPassword !== "string") {
    return res.status(400).json({
      error: "Missing required fields",
      message: "Token and password are required",
    });
  }

  if (nextPassword.trim().length < 8) {
    return res.status(400).json({
      error: "Invalid password",
      message: "Password must be at least 8 characters long",
    });
  }

  try {
    const decodedPayload = parseTokenPayload(token);

    if (
      !decodedPayload ||
      decodedPayload.purpose !== "password-reset" ||
      typeof decodedPayload.userId !== "number"
    ) {
      return res.status(400).json({
        error: "Invalid token",
        message: "Password reset token is invalid",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: decodedPayload.userId },
      select: {
        id: true,
        password: true,
        status: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt || user.status !== "active") {
      return res.status(400).json({
        error: "Invalid token",
        message: "Password reset token is invalid",
      });
    }

    jwt.verify(token, `${PASSWORD_RESET_SECRET_PREFIX}:${user.password}`);

    const hashedPassword = await bcrypt.hash(nextPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    if (error?.name === "TokenExpiredError") {
      return res.status(400).json({
        error: "Token expired",
        message: "Password reset token has expired",
      });
    }

    if (error?.name === "JsonWebTokenError") {
      return res.status(400).json({
        error: "Invalid token",
        message: "Password reset token is invalid",
      });
    }

    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteCurrentUser = async (req, res) => {
  const userId = req.user.id;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: "inactive",
      },
    });

    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      path: "/",
    });

    return res.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting current user:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
