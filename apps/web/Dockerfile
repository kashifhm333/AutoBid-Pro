# Stage 1: Build Vite React SPA
FROM node:22-alpine AS builder
WORKDIR /app

# Copy monorepo configurations
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/config/package*.json ./packages/config/

# Install dependencies
RUN npm ci

# Copy source code
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build optimized production bundle
RUN npm run build --workspace=apps/web

# Stage 2: Serve via Lightweight Nginx Alpine
FROM nginx:1.27-alpine AS runner

# Copy compiled SPA static assets to Nginx webroot
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy tailored Nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Health check probe
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
