# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci
RUN npm ci --workspace=frontend

# Copy source
COPY frontend ./frontend

# Build application
RUN npm run build --workspace=frontend

# Production stage
FROM node:24-alpine

WORKDIR /app

# Install serve to run the app (production HTTP server)
RUN npm install -g serve

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built app
COPY --from=builder --chown=nodejs:nodejs /app/frontend/dist ./dist

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

# Serve the app
CMD ["serve", "-s", "dist", "-l", "3000"]
