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

export interface UserSettingJson {
  emailReminders?: boolean;
  eventUpdates?: boolean;
  commentsReplies?: boolean;
  marketingNews?: boolean;
  showPastEvents?: boolean;
  autoOpenEventModal?: boolean;
  compactCalendar?: boolean;
  reducedMotion?: boolean;
  highContrast?: boolean;
  weekStart?: "monday" | "sunday";
  showWeekNumbers?: boolean;
  defaultCalendarView?: "month" | "agenda";
  hideCancelledAppointments?: boolean;
}

// User-related types
export interface User {
  id: number;
  name: string;
  email: string;
  emailVerified?: boolean;
  role: "admin" | "user" | "teacher";
  classroom?: string | null;
  status?: "active" | "inactive" | "banned";
  dateOfBirth: string | null; // ISO date string format (YYYY-MM-DD)
  settingJson?: UserSettingJson;
  createdAt?: string; // ISO datetime string
  updatedAt?: string; // ISO datetime string
  deletedAt?: string | null;
  _count?: {
    registrations?: number;
    notifications?: number;
    teacherReservations?: number;
    studentReservations?: number;
    news?: number;
    eventNews?: number;
    eventComments?: number;
  };
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
    role: "admin" | "user" | "teacher";
    dateOfBirth: string | null;
    classroom?: string | null;
  };
  token: string;
}

// Appointment-related types
export interface TeacherOption {
  id: number;
  name: string;
  email: string;
  role: "teacher";
  classroom?: string | null;
}

export interface Appointment {
  id: number;
  teacherId: number;
  studentId: number;
  title: string;
  purpose: string | null;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  startTime: string;
  endTime: string;
  classroom?: string | null;
  createdAt: string;
  updatedAt: string;
  teacher: TeacherOption | null;
}

export interface AdminAppointment extends Appointment {
  student: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user" | "teacher";
  } | null;
}

export interface TeacherAppointment extends Appointment {
  student: {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user" | "teacher";
  } | null;
}

export interface GetAppointmentsResponse {
  message: string;
  appointments: Appointment[];
}

export interface GetTeachersResponse {
  message: string;
  teachers: TeacherOption[];
}

export interface CreateAppointmentRequest {
  teacherId: number;
  title: string;
  startTime: string;
  endTime: string;
}

export interface UpdateAppointmentRequest {
  teacherId?: number;
  title?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateAppointmentResponse {
  message: string;
  appointment: Appointment;
}

export interface UpdateAppointmentResponse {
  message: string;
  appointment: Appointment;
}

export interface DeleteAppointmentResponse {
  message: string;
}

export interface TeacherAvailability {
  id: number;
  teacherId: number;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GetTeacherAvailabilityResponse {
  message: string;
  availability: TeacherAvailability[];
}

export interface TeacherAvailabilityMutationResponse {
  message: string;
  availability: TeacherAvailability;
}

export interface TeacherAppointmentsResponse {
  message: string;
  appointments: TeacherAppointment[];
}

export interface TeacherAppointmentMutationResponse {
  message: string;
  appointment: TeacherAppointment;
}

export interface TeacherEventsResponse {
  message: string;
  events: EventWithRegistrationInfo[];
}

export interface AdminTeacherAvailabilityListResponse {
  message: string;
  availability: TeacherAvailability[];
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  dateOfBirth: string; // ISO date string format (YYYY-MM-DD)
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
  settingJson?: UserSettingJson;
}

export interface GetCurrentUserResponse {
  message: string;
  user: {
    name: string;
    email: string;
    role: "admin" | "user" | "teacher";
    dateOfBirth: string | null;
    classroom?: string | null;
    settingJson?: UserSettingJson;
  };
}

export interface TeacherProfileResponse {
  message: string;
  teacher: {
    id: number;
    name: string;
    email: string;
    role: "teacher";
    classroom: string | null;
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
  classroom: string;
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
    classroom: string;
    date: string; // ISO datetime string
    maxParticipants: number | null;
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
    maxParticipants: number | null;
  };
  registrations: RegistrationWithUser[];
}

// Event comments
export interface EventComment {
  id: number;
  content: string;
  isVerified: boolean;
  deletedAt: string | null;
  isDeleted: boolean;
  canDelete: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
  };
}

export interface EventCommentEventInfo {
  id: number;
  name: string;
  date: string;
  location: string;
}

export interface GetEventCommentsResponse {
  message: string;
  event: EventCommentEventInfo;
  comments: EventComment[];
}

export interface CreateEventCommentResponse {
  message: string;
  comment: EventComment;
  verification?: {
    isVerified: boolean;
    reason: string;
    source: "ai" | "fallback" | "skipped" | string;
  };
}

export interface DeleteEventCommentResponse {
  message: string;
}

export interface NewsAuthor {
  id: number;
  name: string;
}

export interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  publishedAt: string | null;
  createdAt: string;
  author: NewsAuthor | null;
}

export interface AdminNewsItem extends NewsItem {
  isPublished: boolean;
  updatedAt: string;
  deletedAt: string | null;
  author: (NewsAuthor & { email?: string }) | null;
}

export interface AdminNotification {
  id: number;
  userId: number;
  url: string | null;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  } | null;
}

export interface GetLatestPublishedNewsResponse {
  message: string;
  news: NewsItem | null;
}

export interface GetPublishedNewsResponse {
  message: string;
  news: NewsItem[];
}

export interface EventNewsItem {
  id: number;
  eventId: number;
  title: string;
  content: string;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    name: string;
  } | null;
}

export interface GetEventNewsResponse {
  message: string;
  event: {
    id: number;
    name: string;
    creator: string;
  };
  canManageNews: boolean;
  news: EventNewsItem[];
}

export interface CreateEventNewsResponse {
  message: string;
  news: EventNewsItem;
}

export interface UpdateEventNewsResponse {
  message: string;
  news: EventNewsItem;
}

export interface DeleteEventNewsResponse {
  message: string;
}

export interface NotificationItem {
  id: number;
  userId: number;
  url: string | null;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  isRead: boolean;
  createdAt: string;
}

export interface GetNotificationsResponse {
  message: string;
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
}

export interface GetUnreadNotificationCountResponse {
  message: string;
  unreadCount: number;
}

export interface MarkNotificationAsReadResponse {
  message: string;
  notification: NotificationItem;
}

export interface MarkAllNotificationsAsReadResponse {
  message: string;
  updatedCount: number;
}

export interface DeleteNotificationResponse {
  message: string;
}

// API endpoint response types
export type GetAllEventsResponse = EventWithRegistrationInfo[];
export type GetAllUsersResponse = User[];

export interface AdminNewsResponse {
  message: string;
  news: AdminNewsItem[];
}

export interface AdminNewsMutationResponse {
  message: string;
  news: AdminNewsItem;
}

export interface AdminAppointmentsResponse {
  message: string;
  appointments: AdminAppointment[];
}

export interface AdminAppointmentMutationResponse {
  message: string;
  appointment: AdminAppointment;
}

export interface AdminNotificationsResponse {
  message: string;
  notifications: AdminNotification[];
}

export interface AdminNotificationMutationResponse {
  message: string;
  notification: AdminNotification;
}

export interface AdminRegistration extends RegistrationWithUser {
  eventId: number;
  user: RegistrationWithUser["user"] & {
    role?: "admin" | "user" | "teacher";
  };
}

export interface AdminEventRegistrationsResponse {
  message: string;
  event: {
    id: number;
    name: string;
    maxParticipants: number | null;
  };
  registrations: AdminRegistration[];
}

export interface AdminRegistrationMutationResponse {
  message: string;
  registration: AdminRegistration;
}

export interface AdminUserMutationResponse {
  message: string;
  user: User;
}

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
