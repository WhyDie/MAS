# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci

# Now copy the rest of the source code
COPY . .

# Copy source
RUN npm run build --workspace=frontend

# Production stage
FROM node:24-alpine
WORKDIR /app

# Install serve to run the app (production HTTP server)
RUN npm install -g serve

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built app
COPY --from=builder /app/frontend/dist .

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

# Serve the app from the current directory
CMD ["serve", "-s", ".", "-l", "3000"]
