# Multi-stage Dockerfile for Task Rewards Application
# This Dockerfile builds both frontend and backend in one file

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

# Build argument for API URL
ARG REACT_APP_API_URL=https://mnworks.site/api
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source
COPY frontend/ ./

# Build the React application
RUN npm run build

# Stage 2: Build Backend Dependencies
FROM node:18-alpine AS backend-deps

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies (production only)
RUN npm ci --only=production

# Stage 3: Production Image
FROM node:18-alpine

WORKDIR /app

# Install serve to serve static frontend files
RUN npm install -g serve

# Copy backend dependencies and source
COPY --from=backend-deps /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy built frontend from frontend-build stage
COPY --from=frontend-build /app/frontend/build ./frontend/build

# Expose ports
EXPOSE 5000 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create initialization and startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'echo "=================================="' >> /app/start.sh && \
    echo 'echo "Task Rewards Application Starting"' >> /app/start.sh && \
    echo 'echo "=================================="' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Wait for MongoDB to be ready' >> /app/start.sh && \
    echo 'echo "Waiting for MongoDB to be ready..."' >> /app/start.sh && \
    echo 'sleep 5' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Run database initialization (only on first run)' >> /app/start.sh && \
    echo 'cd /app/backend' >> /app/start.sh && \
    echo 'echo "Seeding database with packages and tasks..."' >> /app/start.sh && \
    echo 'node seedData.js || echo "Seed already exists or failed"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "Creating admin account..."' >> /app/start.sh && \
    echo 'node createAdminAccount.js || echo "Admin already exists or failed"' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo 'echo "=================================="' >> /app/start.sh && \
    echo 'echo "Starting services..."' >> /app/start.sh && \
    echo 'echo "=================================="' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start frontend' >> /app/start.sh && \
    echo 'echo "✓ Starting frontend on port 3000..."' >> /app/start.sh && \
    echo 'serve -s /app/frontend/build -l 3000 &' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start backend' >> /app/start.sh && \
    echo 'echo "✓ Starting backend on port 5000..."' >> /app/start.sh && \
    echo 'cd /app/backend && node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Run the startup script
CMD ["/app/start.sh"]
