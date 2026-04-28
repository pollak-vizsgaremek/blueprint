# Documentation

- Product design: [Figma design](https://www.figma.com/design/zAolEbfuVy0w17Nd38a9ZD/oldal?node-id=82-177&t=k0ifczP81rzbQB8W-1)
- Project setup: [Root README](../README.md)
- Backend API and environment: [Backend README](../backend/README.md)
- Frontend routes and auth UX: [Frontend README](../frontend/README.md)

## Event Navigation Notes

- Event map presets were removed from the product flow.
- Routing uses `FőBej` -> event `classroom` pathing in the frontend navigation component.
- Ensure backend Prisma client is regenerated after schema changes:
  - `npx prisma generate`

## Auth & Email Flow

- Email confirmation route: `/confirm-email?token=...`
- Password reset route: `/reset-password?token=...`
- Backend email delivery uses Microsoft Graph OAuth2.
