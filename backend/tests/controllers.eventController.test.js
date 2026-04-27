import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import prisma from "../config/database.js";
import { createMockResponse } from "./utils/httpMocks.js";

const { getEventRegistrations } = await import(
  "../controllers/eventController.js"
);

const originalEventFindUnique = prisma.event.findUnique;
const originalRegistrationFindMany = prisma.registration.findMany;

beforeEach(() => {
  prisma.event.findUnique = originalEventFindUnique;
  prisma.registration.findMany = originalRegistrationFindMany;
});

after(() => {
  prisma.event.findUnique = originalEventFindUnique;
  prisma.registration.findMany = originalRegistrationFindMany;
});

test("getEventRegistrations returns 400 for non-numeric event id", async () => {
  const request = {
    params: { eventId: "not-a-number" },
    user: { id: 1, role: "admin" },
  };
  const response = createMockResponse();

  await getEventRegistrations(request, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body?.message, "Event ID must be a number");
});

test("getEventRegistrations blocks non-admin users", async () => {
  let registrationQueryCalled = false;

  prisma.event.findUnique = async () => ({
    id: 7,
    name: "Math Workshop",
    maxParticipants: 30,
  });

  prisma.registration.findMany = async () => {
    registrationQueryCalled = true;
    return [];
  };

  const request = {
    params: { eventId: "7" },
    user: { id: 2, role: "teacher" },
  };
  const response = createMockResponse();

  await getEventRegistrations(request, response);

  assert.equal(response.statusCode, 403);
  assert.equal(response.body?.message, "Admin privileges required");
  assert.equal(registrationQueryCalled, false);
});

test("getEventRegistrations returns registrations for admin users", async () => {
  prisma.event.findUnique = async () => ({
    id: 9,
    name: "Science Club",
    maxParticipants: 20,
  });

  prisma.registration.findMany = async () => [
    {
      id: 101,
      registeredAt: new Date("2026-01-05T10:00:00.000Z"),
      status: "registered",
      user: {
        id: 1,
        name: "Student One",
        email: "student1@example.com",
      },
    },
  ];

  const request = {
    params: { eventId: "9" },
    user: { id: 99, role: "admin" },
  };
  const response = createMockResponse();

  await getEventRegistrations(request, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body?.message, "Event registrations retrieved successfully");
  assert.equal(response.body?.event?.id, 9);
  assert.equal(response.body?.registrations?.length, 1);
  assert.deepEqual(response.body?.registrations?.[0]?.user, {
    id: 1,
    name: "Student One",
    email: "student1@example.com",
  });
});
