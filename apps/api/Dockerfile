# Stage 1: Dependencies & Build
FROM node:22-alpine AS builder
WORKDIR /app

# Install required native libraries for Prisma on Alpine Linux
RUN apk add --no-cache openssl

# Copy monorepo workspace configurations
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/config/package*.json ./packages/config/
COPY packages/validation/package*.json ./packages/validation/

# Install full dependencies across workspace
RUN npm ci

# Copy packages and API source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Generate Prisma Client
RUN npm run prisma:generate --workspace=apps/api

# Stage 2: Minimal Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

# Install process supervisor and runtime libraries
RUN apk add --no-cache dumb-init openssl curl

ENV NODE_ENV=production
ENV PORT=4000

# Copy application and artifacts from builder
COPY --from=builder /app ./

# Execute as unprivileged node user (OWASP container security)
USER node

EXPOSE 4000

# Liveness probe
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:4000/health/live || exit 1

# dumb-init forwards signals properly to Node child processes
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/src/server.js"]
