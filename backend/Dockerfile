FROM node:20-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create app directory
WORKDIR /usr/src/app

# Install dependencies first (better caching)
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source
COPY . .

# Generate Prisma client at build time
RUN npx prisma generate

# Set production environment
ENV NODE_ENV=production

EXPOSE 8000

# Simple entrypoint: run migrations then start server
CMD sh -c "npx prisma migrate deploy && npm run start"
