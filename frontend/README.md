# Blueprint Frontend

Frontend application for the Blueprint event management platform.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- TanStack Query
- GSAP animations

## Prerequisites

- Node.js 20+
- npm 10+

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the env example:

```bash
cp .env.example .env
```

Or create a local `.env` file manually:

```env
# Frontend API base URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

3. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Base URL for the backend API (exposed to the browser).
- `PLAYWRIGHT_USER_EMAIL`: Seeded user email for authenticated Playwright tests (optional).
- `PLAYWRIGHT_USER_PASSWORD`: Seeded user password for authenticated Playwright tests (optional).
- `PLAYWRIGHT_TEACHER_EMAIL`: Seeded teacher email for authenticated Playwright tests (optional).
- `PLAYWRIGHT_TEACHER_PASSWORD`: Seeded teacher password for authenticated Playwright tests (optional).

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: authenticated e2e smoke
PLAYWRIGHT_USER_EMAIL=
PLAYWRIGHT_USER_PASSWORD=
PLAYWRIGHT_TEACHER_EMAIL=
PLAYWRIGHT_TEACHER_PASSWORD=
```

## Scripts

- `npm run dev` - Start local development server (Turbopack)
- `npm run build` - Create production build (Turbopack)
- `npm start` - Run production server

## Main Routes

- `/` - Landing page
- `/login` - Login
- `/register` - Register
- `/confirm-email` - Email confirmation by token
- `/reset-password` - Password reset by token
- `/app` - Main authenticated app area
- `/admin` - Admin area

## Event Navigation

- Event location navigation uses classroom-based routing.
- Start point is fixed to `FőBej`.
- Destination is the event's selected classroom.
- Admin and teacher event forms require classroom selection.

## Auth UX Notes

- Login requires verified email.
- If a user tries to log in without verified email, the login page shows a resend-confirmation action.
- The login page includes a forgot-password request flow.
- Error messages shown to end users are intentionally generic.

## Project Structure

```text
frontend/
  src/
    app/          # App Router routes and layouts
    components/   # Shared UI and providers
    contexts/     # Auth and modal context state
    lib/          # Utilities and app-level helpers
  public/         # Static assets
```

## Troubleshooting

- If API requests fail, verify `NEXT_PUBLIC_API_URL` in `.env`.
- If dependency install fails, remove `node_modules` and reinstall.
- If stale build output appears, remove `.next` and restart the dev server.
