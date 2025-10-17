FROM node:20-alpine AS build
WORKDIR /usr/src/app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent

# Copy source and config
COPY . .

# Build arguments for environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js app (envs are baked in at build time)
RUN npm run build

# Production stage
FROM node:20-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy only what's needed for production
COPY --from=build /usr/src/app/package.json ./
COPY --from=build /usr/src/app/.next ./.next
COPY --from=build /usr/src/app/public ./public
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/next.config.* ./

EXPOSE 3000
CMD ["npm", "start"]
