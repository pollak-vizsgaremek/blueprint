# Blueprint - Event Management Application

Full-stack event management app with Next.js frontend, Express backend, MySQL, and MinIO.

## Architecture

- `frontend`: Next.js 16 + TypeScript
- `backend`: Express + Prisma
- `mysql`: application database
- `minio`: object storage for uploaded images

## Quick Start (No Docker)

1. Install dependencies

```bash
# from repo root
cd backend && npm install
cd ../frontend && npm install
```

2. Configure env files

- Backend: create `backend/.env` with database, JWT, MinIO, and email settings.
- Frontend: create `frontend/.env` with `NEXT_PUBLIC_API_URL`.

3. Prepare database and Prisma client

```bash
cd backend
npx prisma generate
npx prisma migrate deploy
```

4. Run services

```bash
# terminal 1
cd backend
npm run dev

# terminal 2
cd frontend
npm run dev
```

5. Open app

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

## Navigation & Classrooms

- Event navigation uses classroom-based routing inspired by PollakFind.
- Route start is fixed to `FőBej`.
- Destination comes from event `classroom`.
- Classroom is required when creating/updating events (admin and teacher).

## Auth & Email

- Login requires verified email.
- Frontend routes:
  - `/confirm-email?token=...`
  - `/reset-password?token=...`
- Backend email sending uses Microsoft Graph OAuth2.

## Notes

- After Prisma schema changes, run `npx prisma generate` again and restart backend.
- See module docs:
  - `backend/README.md`
  - `frontend/README.md`
  - `docs/README.md`
