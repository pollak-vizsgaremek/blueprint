# Blueprint Backend

A REST API backend for an event management system built with Node.js, Express, and Prisma with MySQL database.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Event Management**: Create, read events with registration functionality
- **Event Images**: Support for event image URLs with fallback handling
- **Participant Management**: Maximum participant limits with capacity checking
- **Advanced Registration**: Registration status tracking (registered, cancelled, attended)
- **Registration Re-activation**: Users can re-register for events they previously cancelled
- **User Registration**: User signup, login, and profile management
- **Database**: MySQL database with Prisma ORM
- **CORS Support**: Cross-origin resource sharing enabled
- **Error Handling**: Centralized error handling middleware

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **CORS**: cors middleware

## Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── eventController.js   # Event business logic
│   └── userController.js    # User business logic
├── middleware/
│   ├── auth.js             # Authentication middleware
│   └── errorHandler.js     # Error handling middleware
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Database migrations
├── routes/
│   ├── events.js          # Event routes
│   └── users.js           # User routes
├── generated/
│   └── prisma/            # Generated Prisma client
├── index.js               # Application entry point
└── package.json           # Dependencies and scripts
```

## Prerequisites

- Node.js (v16 or higher)
- MySQL database
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
   Create a `.env` file in the backend root directory:

   ```env
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   JWT_SECRET="your-super-secret-jwt-key"
   PORT=8000
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

5. **Start the server**

   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The server will start on `http://localhost:8000` by default.

## Database Schema

### Users

- `id`: Auto-increment primary key
- `name`: User's full name
- `email`: Unique email address
- `password`: Hashed password
- `dateOfBirth`: User's date of birth
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp

### Events

- `id`: Auto-increment primary key
- `name`: Event name
- `description`: Event description
- `imageUrl`: Optional event image URL
- `creator`: Event creator name
- `location`: Event location
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

#### Protected Routes

- **GET** `/users/profile` - Get current user profile
- **GET** `/users` - Get all users
- **GET** `/users/:id` - Get user by ID
- **PUT** `/users/:id` - Update user by ID

### Event Routes

#### Public Routes

- **GET** `/events` - Get all events with registration counts and capacity status (optional auth for user registration status)

#### Protected Routes

- **POST** `/events` - Create a new event

  ```json
  {
    "name": "Tech Conference 2024",
    "description": "Annual technology conference",
    "imageUrl": "https://example.com/image.jpg",
    "location": "Convention Center",
    "date": "2024-12-01T10:00:00Z",
    "maxParticipants": 100
  }
  ```

- **GET** `/events/my-registrations` - Get user's event registrations
- **POST** `/events/:eventId/register` - Register for an event
- **DELETE** `/events/:eventId/register` - Unregister from an event
- **GET** `/events/:eventId/registrations` - Get event registrations

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

## Environment Variables

| Variable       | Description                | Default  |
| -------------- | -------------------------- | -------- |
| `DATABASE_URL` | MySQL connection string    | Required |
| `JWT_SECRET`   | Secret key for JWT signing | Required |
| `PORT`         | Server port                | 8000     |

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt
- **JWT Authentication**: Stateless authentication using JSON Web Tokens
- **CORS Protection**: Cross-origin resource sharing configuration
- **Input Validation**: Basic input validation and sanitization
- **Error Handling**: Secure error responses without sensitive information
