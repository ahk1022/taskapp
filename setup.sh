#!/bin/bash
set -euo pipefail

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

# Helpers
check_command() {
  if ! command -v "$1" &>/dev/null; then
    echo -e "${RED}Error: $1 is required but not installed.${NC}"
    exit 1
  fi
}

# Required tools
check_command docker
check_command certbot
check_command nginx

# Inputs
read -p "Enter domain name (e.g., example.com): " domain_name
read -p "Enter frontend port (default: 3000): " frontend_port
read -p "Enter backend API port (default: 5000): " backend_port

# Set defaults
frontend_port=${frontend_port:-3000}
backend_port=${backend_port:-5000}

# Validate
if [ -z "$domain_name" ]; then
  echo -e "${RED}Error: Domain name is required${NC}"; exit 1
fi

# Remove existing Dockerfile and create new one
echo -e "${YELLOW}Creating Dockerfile...${NC}"
rm -f Dockerfile
cat > Dockerfile <<'DOCKERFILE'
# Multi-stage Dockerfile for Task Rewards Application
# This Dockerfile builds both frontend and backend in one file

# Stage 1: Build Frontend
FROM node:18-alpine AS frontend-build

WORKDIR /app/frontend

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
    echo 'echo "Starting frontend on port 3000..."' >> /app/start.sh && \
    echo 'serve -s /app/frontend/build -l 3000 &' >> /app/start.sh && \
    echo '' >> /app/start.sh && \
    echo '# Start backend' >> /app/start.sh && \
    echo 'echo "Starting backend on port 5000..."' >> /app/start.sh && \
    echo 'cd /app/backend && node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 1

# Run the startup script
CMD ["/app/start.sh"]
DOCKERFILE

# Create docker-compose.yml
echo -e "${YELLOW}Creating docker-compose.yml...${NC}"
rm -f docker-compose.yml
cat > docker-compose.yml <<'COMPOSE'
version: '3.8'

services:
  # MongoDB Database
  mongodb:
    image: mongo:7.0
    container_name: taskapp-mongodb
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: task-reward-app
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    networks:
      - task-rewards-network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 40s

  # Application (Frontend + Backend)
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: taskapp-app
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=5000
      - MONGODB_URI=mongodb://admin:admin123@mongodb:27017/task-reward-app?authSource=admin
      - JWT_SECRET=your_jwt_secret_key_change_this_in_production_use_long_random_string
      - REFERRAL_BONUS=10
    ports:
      - "3000:3000"
      - "5000:5000"
    depends_on:
      mongodb:
        condition: service_healthy
    networks:
      - task-rewards-network
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:5000', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # MongoDB Express (Database Admin UI)
  mongo-express:
    image: mongo-express:latest
    container_name: taskapp-mongo-express
    restart: unless-stopped
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: admin
      ME_CONFIG_MONGODB_ADMINPASSWORD: admin123
      ME_CONFIG_MONGODB_URL: mongodb://admin:admin123@mongodb:27017/
      ME_CONFIG_BASICAUTH_USERNAME: admin
      ME_CONFIG_BASICAUTH_PASSWORD: admin123
    ports:
      - "8081:8081"
    depends_on:
      - mongodb
    networks:
      - task-rewards-network

networks:
  task-rewards-network:
    driver: bridge

volumes:
  mongodb_data:
    driver: local
  mongodb_config:
    driver: local
COMPOSE

echo -e "${YELLOW}Starting Docker containers...${NC}"
docker-compose up -d --build

echo -e "${YELLOW}Waiting for containers to be healthy...${NC}"
sleep 10

# Stop nginx for certbot standalone mode
echo -e "${YELLOW}Obtaining SSL certificate...${NC}"
sudo systemctl stop nginx || sudo service nginx stop || true

sudo certbot certonly --standalone -d "${domain_name}" --non-interactive --agree-tos --register-unsafely-without-email || {
  echo -e "${RED}Certbot failed. You may need to run manually: sudo certbot certonly --standalone -d ${domain_name}${NC}"
}

# Generate Nginx configuration
echo -e "${YELLOW}Generating Nginx configuration...${NC}"

cat > /tmp/nginx_${domain_name}.conf <<EOF
server {
    listen 80;
    server_name ${domain_name};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${domain_name};

    ssl_certificate /etc/letsencrypt/live/${domain_name}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain_name}/privkey.pem;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    add_header Strict-Transport-Security "max-age=63072000" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Frontend
    location / {
        proxy_pass http://127.0.0.1:${frontend_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:${backend_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

sudo mv /tmp/nginx_${domain_name}.conf "/etc/nginx/sites-available/${domain_name}"
sudo ln -sf "/etc/nginx/sites-available/${domain_name}" "/etc/nginx/sites-enabled/${domain_name}"

# Test and start nginx
echo -e "${YELLOW}Testing Nginx configuration...${NC}"
sudo nginx -t

echo -e "${YELLOW}Starting Nginx...${NC}"
sudo systemctl start nginx || sudo service nginx start

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Domain: https://${domain_name}"
echo "Frontend: https://${domain_name}/"
echo "Backend API: https://${domain_name}/api"
echo "Mongo Express: http://${domain_name}:8081"
echo ""
echo "Useful commands:"
echo "  docker compose logs -f     # View logs"
echo "  docker compose down        # Stop containers"
echo "  docker compose up -d       # Start containers"