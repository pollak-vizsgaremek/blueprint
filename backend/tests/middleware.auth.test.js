import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";
import { createMockResponse, createNextSpy } from "./utils/httpMocks.js";

process.env.JWT_SECRET ??= "test-secret";

const { authenticateToken, authenticateAdminToken } = await import(
  "../middleware/auth.js"
);

const originalFindUnique = prisma.user.findUnique;

const createToken = (payload = {}) => {
  return jwt.sign(
    {
      userId: 10,
      email: "jane@example.com",
      name: "Jane",
      dateOfBirth: "2001-05-01",
      ...payload,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
};

beforeEach(() => {
  prisma.user.findUnique = originalFindUnique;
});

after(() => {
  prisma.user.findUnique = originalFindUnique;
});

test("authenticateToken returns 401 when no token is provided", async () => {
  const request = { cookies: {}, headers: {} };
  const response = createMockResponse();
  const next = createNextSpy();

  await authenticateToken(request, response, next);

  assert.equal(response.statusCode, 401);
  assert.equal(response.body?.message, "No token provided");
  assert.equal(next.called, false);
});

test("authenticateToken blocks inactive users", async () => {
  prisma.user.findUnique = async () => ({
    id: 10,
    role: "user",
    status: "inactive",
    deletedAt: null,
    settingJson: {},
  });

  const request = {
    cookies: {},
    headers: {
      authorization: `Bearer ${createToken()}`,
    },
  };
  const response = createMockResponse();
  const next = createNextSpy();

  await authenticateToken(request, response, next);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body?.message, "Account is not active");
  assert.equal(next.called, false);
});

test("authenticateAdminToken blocks non-admin users", async () => {
  prisma.user.findUnique = async () => ({
    id: 10,
    role: "teacher",
    status: "active",
    deletedAt: null,
  });

  const request = {
    cookies: { token: createToken() },
    headers: {},
  };
  const response = createMockResponse();
  const next = createNextSpy();

  await authenticateAdminToken(request, response, next);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body?.message, "Admin privileges required");
  assert.equal(next.called, false);
});

test("authenticateAdminToken attaches admin user and calls next", async () => {
  prisma.user.findUnique = async () => ({
    id: 10,
    role: "admin",
    status: "active",
    deletedAt: null,
  });

  const request = {
    cookies: {},
    headers: {
      authorization: `Bearer ${createToken()}`,
    },
  };
  const response = createMockResponse();
  const next = createNextSpy();

  await authenticateAdminToken(request, response, next);

  assert.equal(next.called, true);
  assert.equal(response.statusCode, 200);
  assert.equal(request.user?.role, "admin");
  assert.equal(request.user?.isAdmin, true);
});
