# Multi-stage build for production deployment
FROM oven/bun:1-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and config
COPY package*.json bun.lockb ./
COPY vite.config.ts ./
COPY tsconfig*.json ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code and build files
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the application
RUN bun run build

# Production stage
FROM nginx:alpine AS production

# Install security updates and curl for health checks
RUN apk update && apk upgrade && apk add --no-cache curl

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA
RUN echo 'server { \
    listen 3000; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /health { \
        return 200 "healthy"; \
        add_header Content-Type text/plain; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf.bak 2>/dev/null || true

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]