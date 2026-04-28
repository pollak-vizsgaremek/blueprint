import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";
import { createMockResponse } from "./utils/httpMocks.js";

process.env.JWT_SECRET ??= "test-secret";

const { userLogin, confirmEmail, resetPassword } = await import(
  "../controllers/userController.js"
);

const originalFindUnique = prisma.user.findUnique;
const originalUpdate = prisma.user.update;
const originalCompare = bcrypt.compare;
const originalHash = bcrypt.hash;

beforeEach(() => {
  prisma.user.findUnique = originalFindUnique;
  prisma.user.update = originalUpdate;
  bcrypt.compare = originalCompare;
  bcrypt.hash = originalHash;
});

after(() => {
  prisma.user.findUnique = originalFindUnique;
  prisma.user.update = originalUpdate;
  bcrypt.compare = originalCompare;
  bcrypt.hash = originalHash;
});

test("userLogin blocks deleted accounts before password verification", async () => {
  let compareCalled = false;

  prisma.user.findUnique = async () => ({
    id: 22,
    name: "Deleted User",
    email: "deleted@example.com",
    password: "hashed-password",
    role: "user",
    status: "active",
    deletedAt: new Date(),
    dateOfBirth: null,
  });

  bcrypt.compare = async () => {
    compareCalled = true;
    return true;
  };

  const request = {
    body: {
      email: "deleted@example.com",
      password: "plain-password",
    },
  };
  const response = createMockResponse();

  await userLogin(request, response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body?.message, "Account is not available");
  assert.equal(compareCalled, false);
});

test("userLogin blocks inactive accounts before password verification", async () => {
  let compareCalled = false;

  prisma.user.findUnique = async () => ({
    id: 33,
    name: "Inactive User",
    email: "inactive@example.com",
    password: "hashed-password",
    role: "user",
    status: "inactive",
    deletedAt: null,
    dateOfBirth: null,
  });

  bcrypt.compare = async () => {
    compareCalled = true;
    return true;
  };

  const request = {
    body: {
      email: "inactive@example.com",
      password: "plain-password",
    },
  };
  const response = createMockResponse();

  await userLogin(request, response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body?.message, "Account is not active");
  assert.equal(compareCalled, false);
});

test("userLogin returns profile data and sets auth cookie for active users", async () => {
  prisma.user.findUnique = async () => ({
    id: 44,
    name: "Active User",
    email: "active@example.com",
    password: "hashed-password",
    role: "teacher",
    status: "active",
    emailVerified: true,
    deletedAt: null,
    dateOfBirth: new Date("1999-06-15T00:00:00.000Z"),
  });

  bcrypt.compare = async () => true;

  const request = {
    body: {
      email: "active@example.com",
      password: "plain-password",
    },
  };
  const response = createMockResponse();

  await userLogin(request, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body?.message, "Login successful");
  assert.equal(response.body?.user?.email, "active@example.com");
  assert.equal(response.body?.user?.role, "teacher");
  assert.equal(response.body?.user?.dateOfBirth, "1999-06-15");

  assert.equal(response.cookies.length, 1);
  assert.equal(response.cookies[0].name, "token");
  assert.equal(typeof response.cookies[0].value, "string");
  assert.equal(response.cookies[0].options?.httpOnly, true);
});

test("confirmEmail updates user when token is valid", async () => {
  const token = jwt.sign(
    {
      purpose: "email-confirmation",
      userId: 55,
      email: "verify@example.com",
    },
    `${process.env.JWT_SECRET}:email-confirm`,
    { expiresIn: "1h" },
  );

  let updatedUserId = null;

  prisma.user.findUnique = async () => ({
    id: 55,
    email: "verify@example.com",
    emailVerified: false,
  });

  prisma.user.update = async ({ where }) => {
    updatedUserId = where.id;
    return { id: where.id };
  };

  const request = {
    body: {
      token,
    },
  };
  const response = createMockResponse();

  await confirmEmail(request, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body?.message, "Email confirmed successfully");
  assert.equal(updatedUserId, 55);
});

test("resetPassword returns 400 for invalid token", async () => {
  const request = {
    body: {
      token: "invalid-token",
      password: "new-password-123",
    },
  };
  const response = createMockResponse();

  await resetPassword(request, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body?.error, "Invalid token");
});
