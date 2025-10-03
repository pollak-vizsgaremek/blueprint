// Base response types
export interface ApiResponse<T = any> {
  message?: string;
  error?: string;
  data?: T;
}

export interface ErrorResponse {
  error: string;
  message?: string;
}

// User-related types
export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  dateOfBirth: string | null; // ISO date string format (YYYY-MM-DD)
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
}

export interface UserWithoutPassword extends Omit<User, "password"> {}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: {
    name: string;
    email: string;
    role: "admin" | "user";
    dateOfBirth: string | null;
  };
  token: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  dateOfBirth?: string; // ISO date string format (YYYY-MM-DD)
}

export interface CreateUserResponse {
  message: string;
  user: UserWithoutPassword;
  token: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  dateOfBirth?: string; // ISO date string format (YYYY-MM-DD)
}

export interface GetCurrentUserResponse {
  message: string;
  user: {
    name: string;
    email: string;
    dateOfBirth: string | null;
  };
}

// Event-related types
export interface Event {
  id: number;
  name: string;
  description: string;
  imageUrl: string | null;
  creator: string;
  location: string;
  date: string; // ISO datetime string
  maxParticipants: number | null;
  createdAt: string; // ISO datetime string
}

export interface UserRegistration {
  id: number;
  registeredAt: string; // ISO datetime string
  status: "registered" | "cancelled" | "attended";
}

export interface EventWithRegistrationInfo extends Event {
  registrationCount: number;
  userRegistration: UserRegistration | null;
  isUserRegistered: boolean;
  isFull: boolean;
}

export interface CreateEventRequest {
  name: string;
  description: string;
  imageUrl?: string;
  location: string;
  date: string; // ISO datetime string
  maxParticipants?: number;
}

export interface CreateEventResponse {
  message: string;
  event: Event;
}

// Registration-related types
export interface Registration {
  id: number;
  userId: number;
  eventId: number;
  registeredAt: string; // ISO datetime string
  status: "registered" | "cancelled" | "attended";
}

export interface RegistrationWithEvent extends Omit<Registration, "userId"> {
  event: {
    id: number;
    name: string;
    description: string;
    imageUrl: string | null;
    creator: string;
    location: string;
    date: string; // ISO datetime string
    createdAt: string; // ISO datetime string
  };
}

export interface RegistrationWithUser extends Omit<Registration, "eventId"> {
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export interface RegisterForEventResponse {
  message: string;
  registration: {
    id: number;
    eventId: number;
    registeredAt: string; // ISO datetime string
    status: "registered" | "cancelled" | "attended";
  };
}

export interface UnregisterFromEventResponse {
  message: string;
}

export interface GetUserEventRegistrationsResponse {
  message: string;
  registrations: RegistrationWithEvent[];
}

export interface GetEventRegistrationsResponse {
  message: string;
  event: {
    id: number;
    name: string;
  };
  registrations: RegistrationWithUser[];
}

// API endpoint response types
export type GetAllEventsResponse = EventWithRegistrationInfo[];
export type GetAllUsersResponse = User[];
export type GetUserByIdResponse = User;

// Common error responses
export interface ValidationErrorResponse extends ErrorResponse {
  error:
    | "Invalid maxParticipants"
    | "No valid fields to update"
    | "Invalid credentials";
}

export interface ConflictErrorResponse extends ErrorResponse {
  error:
    | "Email already exists"
    | "Already registered"
    | "Event full"
    | "Registration already cancelled";
}

export interface NotFoundErrorResponse extends ErrorResponse {
  error: "User not found" | "Event not found" | "Registration not found";
}

export interface InternalServerErrorResponse extends ErrorResponse {
  error: "Internal Server Error";
}
