# Docker Setup Guide - Task Rewards Application

## 🚀 Quick Start

### Start the Application
```bash
# Build and start all services (MongoDB + App)
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f app
docker-compose logs -f mongodb
```

### Stop the Application
```bash
# Stop all services
docker-compose down

# Stop and remove all data (including database)
docker-compose down -v
```

## 🔐 Default Credentials

### Admin Account
After the first run, an admin account will be automatically created:

- **Email**: `admin@taskrewards.com`
- **Password**: `admin123`
- **Admin Dashboard**: http://localhost:3000/admin

### Database Credentials
- **MongoDB Root User**: `admin`
- **MongoDB Root Password**: `admin123`
- **Database Name**: `task-reward-app`

### Mongo Express (Database Admin UI)
- **URL**: http://localhost:8081
- **Username**: `admin`
- **Password**: `admin123`

## 🌐 Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React application |
| Backend API | http://localhost:5000 | REST API endpoints |
| MongoDB | localhost:27017 | MongoDB database |
| Mongo Express | http://localhost:8081 | Database admin interface |

## 📦 What Gets Initialized Automatically

On first run, the application will automatically:

1. ✅ Create MongoDB database
2. ✅ Seed 4 investment packages (Basic, Silver, Gold, Platinum)
3. ✅ Seed 10 sample tasks
4. ✅ Create admin account (admin@taskrewards.com / admin123)

## 🔧 Useful Docker Commands

```bash
# Rebuild the application (after code changes)
docker-compose up -d --build

# View running containers
docker-compose ps

# Access app container shell
docker-compose exec app sh

# Access MongoDB shell
docker-compose exec mongodb mongosh -u admin -p admin123

# View real-time logs
docker-compose logs -f

# Restart a specific service
docker-compose restart app
docker-compose restart mongodb

# Remove everything and start fresh
docker-compose down -v
docker-compose up -d --build
```

## 🔒 Production Security Checklist

**⚠️ IMPORTANT: Change these before deploying to production!**

### 1. Update docker-compose.yml
```yaml
# Change MongoDB credentials
MONGO_INITDB_ROOT_PASSWORD: "YOUR_SECURE_PASSWORD_HERE"

# Change admin credentials for Mongo Express
ME_CONFIG_BASICAUTH_PASSWORD: "YOUR_SECURE_PASSWORD_HERE"

# Change JWT secret
JWT_SECRET: "YOUR_LONG_RANDOM_SECRET_KEY_AT_LEAST_32_CHARACTERS"

# Update MongoDB connection string with new password
MONGODB_URI: mongodb://admin:YOUR_SECURE_PASSWORD@mongodb:27017/task-reward-app?authSource=admin
```

### 2. Update backend/createAdminAccount.js
Change the default admin credentials in the script before building.

### 3. Disable Mongo Express in Production
Comment out or remove the mongo-express service from docker-compose.yml

## 📊 Database Management

### Backup Database
```bash
# Create backup
docker-compose exec mongodb mongodump \
  --username=admin \
  --password=admin123 \
  --authenticationDatabase=admin \
  --db=task-reward-app \
  --out=/data/backup

# Copy backup to host
docker cp task-rewards-mongodb:/data/backup ./mongodb-backup
```

### Restore Database
```bash
# Copy backup to container
docker cp ./mongodb-backup task-rewards-mongodb:/data/restore

# Restore database
docker-compose exec mongodb mongorestore \
  --username=admin \
  --password=admin123 \
  --authenticationDatabase=admin \
  --db=task-reward-app \
  /data/restore/task-reward-app
```

## 🐛 Troubleshooting

### MongoDB connection failed
```bash
# Check if MongoDB is running
docker-compose ps

# Check MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Application won't start
```bash
# Check application logs
docker-compose logs app

# Rebuild the application
docker-compose up -d --build
```

### Port already in use
If you get a port conflict error:
1. Change the port mapping in docker-compose.yml
2. Or stop the conflicting service on your host machine

Example - Change frontend port:
```yaml
ports:
  - "3001:3000"  # Access on localhost:3001 instead
```

## 📝 Environment Variables

All environment variables are configured in docker-compose.yml:

| Variable | Default | Description |
|----------|---------|-------------|
| NODE_ENV | production | Application environment |
| PORT | 5000 | Backend API port |
| MONGODB_URI | mongodb://admin:admin123@mongodb:27017/... | Database connection |
| JWT_SECRET | your_jwt_secret... | JWT signing secret |
| REFERRAL_BONUS | 10 | Referral bonus amount |

## 🔄 Development vs Production

### For Development
- Use volume mounts to enable hot-reload
- Enable detailed logging
- Keep Mongo Express enabled

### For Production
- Use the current setup (optimized builds)
- Disable Mongo Express
- Use secure passwords
- Enable HTTPS/SSL
- Use environment variables from secrets management

## 📦 Package Details Seeded

| Package | Price | Tasks/Day | Total Earnings |
|---------|-------|-----------|----------------|
| Basic | ₨500 | 3 | ₨900 |
| Silver | ₨1,000 | 6 | ₨1,800 |
| Gold | ₨2,000 | 12 | ₨3,600 |
| Platinum | ₨3,500 | 21 | ₨6,300 |

## 🎯 Next Steps

1. Start the application: `docker-compose up -d`
2. Wait 30 seconds for initialization
3. Access frontend: http://localhost:3000
4. Login with admin credentials
5. Test the application
6. **Change all default passwords before production!**

## 📞 Support

For issues related to Docker setup, check the logs:
```bash
docker-compose logs -f
```
