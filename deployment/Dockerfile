# Multi-stage build for production deployment
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY vite.config.ts ./
COPY tsconfig*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S forensics -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=forensics:nodejs /app/dist ./dist
COPY --from=builder --chown=forensics:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=forensics:nodejs /app/package*.json ./

# Install production server
RUN npm install -g serve

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs && chown -R forensics:nodejs /app

# Switch to non-root user
USER forensics

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["serve", "-s", "dist", "-l", "3000"]