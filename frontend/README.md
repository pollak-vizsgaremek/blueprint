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

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
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

## Docker

This repo includes a `Dockerfile` for building and running the frontend in production mode.

Build:

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 -t blueprint-frontend .
```

Run:

```bash
docker run --rm -p 3000:3000 blueprint-frontend
```

## Troubleshooting

- If API requests fail, verify `NEXT_PUBLIC_API_URL` in `.env`.
- If dependency install fails, remove `node_modules` and reinstall.
- If stale build output appears, remove `.next` and restart the dev server.
