# Event Management Backend

A comprehensive REST API backend for an event management system built with Node.js, Express, and Prisma with MySQL database and MinIO object storage.

## Features

### Core Functionality

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Event Management**: Full CRUD operations for events with advanced features
- **Classroom Routing Data**: Events store required classroom values for frontend navigation
- **File Storage**: MinIO integration for secure event image uploads and management
- **Admin Panel**: Role-based access control with admin privileges and dedicated routes
- **Registration System**: Advanced event registration with status tracking and capacity management

### Advanced Features

- **Event Images**: MinIO-powered file upload system with automatic URL generation
- **Participant Management**: Maximum participant limits with real-time capacity checking
- **Registration Status Tracking**: Multi-state registration system (registered, cancelled, attended)
- **Registration Re-activation**: Users can re-register for previously cancelled events
- **Admin Controls**: User role management, promotion/demotion capabilities
- **Optional Authentication**: Public event viewing with enhanced features for authenticated users
- **Database**: MySQL database with Prisma ORM for robust data management
- **CORS Support**: Cross-origin resource sharing enabled for frontend integration
- **Error Handling**: Centralized error handling middleware with detailed responses

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **File Storage**: MinIO (S3-compatible object storage)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **File Upload**: Multer with MinIO integration
- **CORS**: cors middleware
- **UUID Generation**: UUID v4 for unique file naming

## Project Structure

```
backend/
├── config/
│   ├── database.js          # Database configuration
│   └── minio.js            # MinIO object storage configuration
├── controllers/
│   ├── adminController.js   # Admin-specific business logic
│   ├── eventController.js   # Event business logic
│   └── userController.js    # User business logic
├── middleware/
│   ├── auth.js             # Authentication & authorization middleware
│   └── upload.js           # File upload middleware with MinIO integration
├── prisma/
│   ├── schema.prisma       # Database schema with admin roles
│   └── migrations/         # Database migrations history
├── routes/
│   ├── events.js          # Public event routes
│   ├── users.js           # User authentication & profile routes
│   └── admin/             # Admin-only routes
│       ├── adminEvents.js # Admin event management
│       └── adminUsers.js  # Admin user management
├── generated/
│   └── prisma/            # Generated Prisma client
├── index.js               # Application entry point & server setup
├── package.json           # Dependencies and scripts
└── README.md              # This documentation
```

## Prerequisites

- Node.js (v18 or higher)
- MySQL database
- MinIO server (for file storage)
- npm or yarn package manager

## Installation & Setup

1. **Clone the repository and navigate to backend folder**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy the example and edit values:

   ```bash
   cp .env.example .env
   ```

   Example `.env` contents:

   ```env
   # Database
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"

   # Auth
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=8000

   # MinIO
   MINIO_ENDPOINT="localhost"
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_ACCESS_KEY="blueprint"
   MINIO_SECRET_KEY="blueprint"
   MINIO_BUCKET="blueprint"

   # Public frontend URL used in email links
   PUBLIC_URL="http://localhost:3000"
   EMAIL_CONFIRM_PATH="/confirm-email"
   PASSWORD_RESET_PATH="/reset-password"

   # Microsoft Graph OAuth2 (email sending)
   MS_TENANT_ID=""
   MS_CLIENT_ID=""
   MS_CLIENT_SECRET=""
   MS_SENDER_USER=""
   MS_GRAPH_SCOPE="https://graph.microsoft.com/.default"

   # Optional email debug mode
   EMAIL_LOG_ONLY=false

   # AI comment verification (optional)
   AI_VERIFICATION_API_KEY=""
   AI_VERIFICATION_MODEL="gemini-2.0-flash"
   AI_MODERATION_LOG_LEVEL="verbose"
   # AI_VERIFICATION_ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
   ```

4. **Set up the database**

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# (Optional) Seed the database
npx prisma db seed
```

After any Prisma schema update, run `npx prisma generate` again and restart the backend process.

5. **Set up MinIO Server**

   You need a running MinIO server for file storage.
   Download and run MinIO locally from [https://min.io/download](https://min.io/download),
   then set matching `MINIO_*` values in `backend/.env`.

6. **Start the server**

   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:8000` by default.
MinIO console is typically available at `http://localhost:9001` (depending on your local MinIO setup).

## Server Configuration

The application uses the following route structure:

- `/events` - Public and user event routes
- `/users` - User authentication and profile management
- `/admin/events` - Admin-only event management
- `/admin/users` - Admin-only user management

Note: legacy event map preset endpoints were removed; event navigation now relies on event `classroom`.

The server is configured with:

- CORS enabled for cross-origin requests
- JSON body parsing middleware
- Modular route organization for better maintainability

## Database Schema

### Users

- `id`: Auto-increment primary key
- `name`: User's full name
- `email`: Unique email address
- `emailVerified`: Email confirmation state
- `password`: Hashed password
- `dateOfBirth`: User's date of birth
- `classroom`: Optional classroom assignment (mainly for teachers)
- `role`: Role string (`user`, `teacher`, `admin`)
- `status`: Account status (`active`, `inactive`, `banned`)
- `settingJson`: Optional JSON user settings
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp
- `deletedAt`: Soft-delete timestamp

### Events

- `id`: Auto-increment primary key
- `name`: Event name
- `description`: Event description (text field)
- `imageUrl`: Optional event image URL (stored in MinIO)
- `creator`: Event creator name
- `location`: Event location
- `classroom`: Required classroom used by frontend navigation
- `date`: Event date and time
- `maxParticipants`: Optional maximum number of participants
- `createdAt`: Event creation timestamp

### Registrations

- `id`: Auto-increment primary key
- `userId`: Reference to user
- `eventId`: Reference to event
- `registeredAt`: Registration timestamp
- `status`: Registration status (registered, cancelled, attended)

## API Endpoints

### Authentication

All protected routes require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Routes

#### Public Routes

- **POST** `/users` - Register a new user

  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "dateOfBirth": "1990-01-01"
  }
  ```

- **POST** `/users/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
  - Login requires verified email.
  - Unverified accounts return `403` with `code: "email_not_verified"`.

- **POST** `/users/email-confirmation/request` - Request email confirmation link

  ```json
  {
    "email": "john@example.com"
  }
  ```

- **POST** `/users/email-confirmation/confirm` - Confirm email with token

  ```json
  {
    "token": "<email-confirmation-token>"
  }
  ```

- **POST** `/users/password-reset/request` - Request password reset link

  ```json
  {
    "email": "john@example.com"
  }
  ```

- **POST** `/users/password-reset/confirm` - Set new password with token

  ```json
  {
    "token": "<password-reset-token>",
    "password": "new-password-123"
  }
  ```

#### Protected Routes

- **GET** `/users/profile` - Get current user profile
- **GET** `/users/:id` - Get user by ID (users can only view their own profile, admins can view any profile)
- **PUT** `/users/:id` - Update user by ID (users can only update their own profile, admins can update any profile)

#### Admin-Only Routes

- **GET** `/admin/users` - Get all users (admin only)
- **PUT** `/admin/users/:id/promote` - Promote user to admin (admin only)
- **PUT** `/admin/users/:id/demote` - Demote user from admin (admin only)

### Event Routes

#### Public Routes

- **GET** `/events` - Get all events with registration counts and capacity status
  - Optional authentication provides user-specific registration status
  - Returns event details with participant counts and availability

#### User Protected Routes (Authentication Required)

- **GET** `/events/my-registrations` - Get user's event registrations
- **POST** `/events/:eventId/register` - Register for an event
- **DELETE** `/events/:eventId/register` - Unregister from an event
- **GET** `/events/:eventId/registrations` - Get event registrations

#### Admin-Only Routes (Admin Authentication Required)

- **POST** `/admin/events` - Create a new event with optional image upload (admin only)
  - Supports multipart/form-data for image upload
  - Automatically handles MinIO storage and URL generation

  **Form Data:**

  ```
  name: "Tech Conference 2024"
  description: "Annual technology conference"
  location: "Convention Center"
  date: "2024-12-01T10:00:00Z"
  maxParticipants: 100
  image: [File] (optional)
  ```

- **PUT** `/admin/events/:eventId` - Update an existing event with optional image upload (admin only)
  - Supports multipart/form-data for image replacement
  - Automatically removes old images from MinIO when replaced

- **DELETE** `/admin/events/:eventId` - Delete an event (admin only)
  - Automatically removes associated image from MinIO storage
  - Cascades registration deletions

## Error Handling

The API uses centralized error handling with consistent error response format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Development

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with auto-reload
- `npm test` - Run tests (not implemented yet)

### Database Commands

- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma migrate deploy` - Apply migrations in production
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db seed` - Seed the database

## MinIO File Storage

The backend uses MinIO for secure file storage with the following features:

### Image Upload Process

1. **File Validation**: Only image files up to 25MB are accepted
2. **Unique Naming**: Files are renamed with UUID to prevent conflicts
3. **MinIO Storage**: Images are stored in organized folder structure (`events/`)
4. **Public Access**: Automatic public read policy for event images
5. **URL Generation**: Permanent direct URLs for reliable image access

### Storage Configuration

- **Bucket Management**: Automatic bucket creation and policy configuration
- **File Organization**: Structured storage with event-specific folders
- **Cleanup**: Automatic removal of old images when events are updated/deleted
- **Error Handling**: Comprehensive error handling for storage operations

## Environment Variables

| Variable                   | Description                        | Default            |
| -------------------------- | ---------------------------------- | ------------------ |
| `DATABASE_URL`             | MySQL connection string            | Required           |
| `JWT_SECRET`               | Secret key for JWT signing         | Required           |
| `PORT`                     | Server port                        | 8000               |
| `MINIO_ENDPOINT`           | MinIO server endpoint              | localhost          |
| `MINIO_PORT`               | MinIO server port                  | 9000               |
| `MINIO_USE_SSL`            | Enable SSL for MinIO               | false              |
| `MINIO_ACCESS_KEY`         | MinIO access key                   | blueprint          |
| `MINIO_SECRET_KEY`         | MinIO secret key                   | blueprint          |
| `MINIO_BUCKET`             | MinIO bucket name                  | blueprint          |
| `AI_VERIFICATION_API_KEY`  | API key for comment verification   | Optional           |
| `AI_VERIFICATION_MODEL`    | Gemini model used for verification | gemini-2.0-flash   |
| `AI_VERIFICATION_ENDPOINT` | Optional custom Gemini endpoint    | Derived from model |
| `AI_MODERATION_LOG_LEVEL`  | Moderation logging verbosity       | verbose            |
| `EMAIL_FROM`               | Sender email address               | no-reply@blueprint.local |
| `EMAIL_LOG_ONLY`           | Log emails instead of sending      | false              |
| `MS_TENANT_ID`             | Azure AD tenant ID                 | Optional           |
| `MS_CLIENT_ID`             | Azure app client ID                | Optional           |
| `MS_CLIENT_SECRET`         | Azure app client secret            | Optional           |
| `MS_SENDER_USER`           | Mailbox used by Graph sendMail     | EMAIL_FROM         |
| `MS_GRAPH_SCOPE`           | OAuth scope for Graph token        | https://graph.microsoft.com/.default |
| `PUBLIC_URL`               | Frontend base URL for email links  | http://localhost:3000 |
| `EMAIL_CONFIRM_PATH`       | Email confirmation path            | /confirm-email     |
| `PASSWORD_RESET_PATH`      | Password reset path                | /reset-password    |

## Email Delivery (OAuth2)

- Email sending uses Microsoft Graph with OAuth2 client credentials.
- SMTP/basic auth is not used.
- `PUBLIC_URL` is used as the base URL for email links.

Common Graph setup checks for `403 ErrorAccessDenied`:

1. Add `Mail.Send` as **Application** permission in Microsoft Graph.
2. Grant **Admin consent**.
3. Ensure `MS_SENDER_USER` is a real mailbox in the same tenant.
4. Ensure `MS_CLIENT_SECRET` uses the secret value (not secret ID).

## AI Comment Moderation

- Comment moderation uses a strict JSON-only classifier prompt.
- The model must return exactly:

```json
{"isVerified": true, "reason": "meaningful and respectful"}
```

- Safety-first policy: uncertain content is treated as not verified.
- The moderator blocks harassment, hate, threats, spam/scams, personal-data exposure, and clearly off-topic or meaningless content.

## Authorization & Security

### Authorization Rules

- **User Profile Management**: Users can only view and update their own profiles
- **Admin User Management**: Admins can view and update any user profile
- **Event Management**: Only admins can create, update, and delete events
- **Event Registration**: All authenticated users can register/unregister for events
- **Admin Promotion**: Only admins can promote/demote other users

### Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with salt rounds
- **JWT Authentication**: Stateless authentication using JSON Web Tokens with 24h expiration
- **Role-Based Access Control**: Admin and user roles with proper authorization checks
- **Route Protection**: Different middleware for user and admin authentication
- **File Upload Security**: Strict file type validation and size limits (25MB)
- **CORS Protection**: Cross-origin resource sharing configuration
- **Input Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Secure error responses without sensitive information
- **Token Validation**: Proper JWT verification with expiration and integrity checks
- **Resource Ownership**: Users can only access and modify their own resources

## Admin Features

### User Management

- **Role Assignment**: Promote/demote users to/from admin status
- **User Oversight**: View all registered users and their details
- **Access Control**: Admin-only endpoints for sensitive operations

### System Administration

- **File Storage Management**: MinIO integration with proper access policies
- **Event Oversight**: Full event management capabilities
- **Registration Monitoring**: View and manage event registrations

## File Upload Specifications

### Supported Formats

- **Image Types**: JPEG, PNG, GIF, WebP, and other standard image formats
- **File Size Limit**: Maximum 25MB per image
- **Naming Convention**: UUID-based naming to prevent conflicts
- **Storage Path**: Organized in `events/` folder structure

### Upload Endpoints

- **Event Creation**: Include image in multipart form data
- **Event Update**: Replace existing image (old image automatically deleted)
- **Image Management**: Automatic cleanup of orphaned files
