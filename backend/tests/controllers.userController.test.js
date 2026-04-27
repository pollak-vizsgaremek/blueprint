import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import prisma from "../config/database.js";
import { createMockResponse } from "./utils/httpMocks.js";

process.env.JWT_SECRET ??= "test-secret";

const { userLogin } = await import("../controllers/userController.js");

const originalFindUnique = prisma.user.findUnique;
const originalCompare = bcrypt.compare;

beforeEach(() => {
  prisma.user.findUnique = originalFindUnique;
  bcrypt.compare = originalCompare;
});

after(() => {
  prisma.user.findUnique = originalFindUnique;
  bcrypt.compare = originalCompare;
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
