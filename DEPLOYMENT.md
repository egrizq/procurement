# Deployment Guide - Procurement Application

Complete guide for deploying the Procurement application using Docker on various platforms (Cloud, VPS, or Local).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Cloud Platform Guides](#cloud-platform-guides)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

---

## Environment Configuration in Docker

**Important:** Docker containers receive environment variables differently:

- **Local Development**: The API loads `.env` file from workspace root
- **Docker**: Environment variables are injected by `docker-compose.yml` (no `.env` file in container)

The application automatically detects which method to use:

```typescript
// env.ts checks if .env exists
if (existsSync(envPath)) {
  dotenvConfig({ path: envPath });  // Local dev
} else {
  // Use environment variables from docker-compose
}
```

This means:
- ✅ No need to copy `.env` into Docker images
- ✅ Sensitive values stay in your local `.env` (not in images)
- ✅ Same code works in both local and Docker environments

---

## Prerequisites

### Required Software

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: For pulling code updates
- **Bash/Shell**: For running deployment scripts (PowerShell on Windows)

### System Requirements

**Minimum:**
- 2 CPU cores
- 2GB RAM
- 10GB disk space

**Recommended:**
- 4+ CPU cores
- 4GB+ RAM
- 20GB+ disk space
- SSD storage

### Database Requirements

- **MariaDB** or **MySQL**: Version 10.x or 8.x
- Database and user with full privileges
- Network access from Docker containers to database server

---

## Environment Configuration

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` file with your configuration:

#### **Database Configuration**

```env
DB_HOST=your-database-host.com
DB_USER=procurement_user
DB_PASSWORD=your-secure-password
DB_NAME=procurement
DB_PORT=3306
DATABASE_URL=mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
```

#### **Application Configuration**

```env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info
```

#### **Security Configuration**

```env
# Generate secure random strings for these:
JWT_SECRET=your-jwt-secret-min-32-chars
API_TOKEN_SECRET=x-api-token
```

**Generate secure secrets:**
```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

#### **CORS Configuration**

```env
# Development
CORS_ORIGIN=http://localhost:5173,http://localhost

# Production (use your actual domain)
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

#### **Frontend Configuration**

```env
# For nginx reverse proxy setup
VITE_API_BASE_URL=/api
VITE_TOKEN_SECRET=x-api-token

# For separate API domain
# VITE_API_BASE_URL=https://api.yourdomain.com/api
```

#### **Port Configuration (Optional)**

```env
API_PORT=3000
WEB_PORT=80
```

---

## Local Development

### Quick Start

1. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your local database credentials
   ```

2. **Make scripts executable:**
   ```bash
   chmod +x scripts/*.sh
   ```

3. **Deploy locally:**
   ```bash
   ./scripts/deploy-local.sh
   ```

### Manual Steps

#### 1. Build Docker Images

```bash
./scripts/build.sh dev latest
```

#### 2. Run Database Migrations

```bash
./scripts/migrate.sh
```

#### 3. Start Containers

```bash
docker-compose -f docker-compose.dev.yml up -d
```

#### 4. Verify Services

```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# Check API health
curl http://localhost:3000/api/health

# Check Web
curl http://localhost/health
```

#### 5. View Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# API only
docker-compose -f docker-compose.dev.yml logs -f api

# Web only
docker-compose -f docker-compose.dev.yml logs -f web
```

### Stopping Development Environment

```bash
docker-compose -f docker-compose.dev.yml down
```

---

## Production Deployment

### Automated Deployment

```bash
./scripts/deploy-cloud.sh
```

The script will:
1. Validate environment configuration
2. Build production images
3. Prompt for database backup
4. Run migrations
5. Deploy containers
6. Verify health checks

### Manual Deployment Steps

#### 1. Prepare Environment

```bash
# Ensure .env is configured for production
export NODE_ENV=production

# Review configuration
cat .env | grep -v PASSWORD
```

#### 2. Build Production Images

```bash
./scripts/build.sh prod production
```

#### 3. Backup Database (Recommended)

```bash
# MySQL/MariaDB
mysqldump -h ${DB_HOST} -u ${DB_USER} -p ${DB_NAME} > backup_$(date +%Y%m%d).sql

# Or use Drizzle (if existing deployment)
docker exec procurement-api-prod npx drizzle db execute --stdin < /dev/null > backup.sql
```

#### 4. Run Migrations

```bash
./scripts/migrate.sh
```

#### 5. Deploy

```bash
# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Start new containers
docker-compose -f docker-compose.prod.yml up -d
```

#### 6. Verify Deployment

```bash
# Check status
docker-compose -f docker-compose.prod.yml ps

# Check health
curl http://localhost:3000/api/health

# Monitor logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 7. Cleanup Old Images

```bash
docker image prune -f
```

---

## Cloud Platform Guides

### AWS EC2

#### 1. Setup EC2 Instance

- **Instance Type**: t3.medium or higher
- **OS**: Ubuntu 22.04 LTS
- **Security Group Rules**:
  - SSH (22) - Your IP only
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
  - Custom TCP (3000) - Internal only

#### 2. Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### 3. Clone and Deploy

```bash
git clone <your-repo-url>
cd Procurement
cp .env.example .env
nano .env  # Edit configuration
./scripts/deploy-cloud.sh
```

#### 4. Setup SSL with Nginx Reverse Proxy

```bash
# Install Nginx and Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/procurement

# Add configuration:
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/procurement /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com
```

### Azure VM

Similar to AWS EC2, use Ubuntu 20.04+ VM with Docker installed:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Deploy application
git clone <repo>
cd Procurement
./scripts/deploy-cloud.sh
```

### DigitalOcean Droplet

1. **Create Droplet**: Ubuntu 22.04, 2GB+ RAM
2. **Setup Docker**:
   ```bash
   apt update && apt install docker.io docker-compose -y
   ```
3. **Deploy**: Follow same steps as AWS

### Google Cloud Platform (GCP)

Create Compute Engine instance and follow AWS EC2 steps.

### Local VPS/Dedicated Server

Same as cloud platforms - install Docker and deploy using scripts.

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptom**: API health check returns `database: 'disconnected'`

**Solutions**:
```bash
# Check database connectivity
mysql -h ${DB_HOST} -u ${DB_USER} -p

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Check Docker network
docker network ls
docker network inspect procurement-network

# Allow Docker network in firewall (if database is on same host)
# MySQL/MariaDB default bind-address should allow Docker IPs
```

#### 2. CORS Errors

**Symptom**: Browser console shows CORS errors

**Solutions**:
```bash
# Update CORS_ORIGIN in .env
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Restart API container
docker-compose -f docker-compose.prod.yml restart api
```

#### 3. Container Won't Start

**Check logs**:
```bash
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs web
```

**Common causes**:
- Port already in use: `sudo netstat -tulpn | grep :3000`
- Invalid environment variables
- Database migration needed

#### 4. Health Check Failing

```bash
# Manual health check
curl -v http://localhost:3000/api/health

# Check container health
docker inspect procurement-api-prod | grep Health -A 10

# Increase health check timeout
# Edit docker-compose file: start_period: 60s
```

#### 5. Migration Errors

```bash
# Check migration status
cd apps/api
npx drizzle migrate status

# Reset if needed (CAUTION: data loss)
npx drizzle migrate reset

# Or manually fix
npx drizzle migrate resolve --rolled-back <migration-name>
npm run db:push
```

### Logging and Debugging

#### View Real-time Logs

```bash
# All containers
docker-compose -f docker-compose.prod.yml logs -f

# Specific container
docker logs -f procurement-api-prod

# Last 100 lines
docker logs --tail 100 procurement-api-prod
```

#### Access Container Shell

```bash
# API container
docker exec -it procurement-api-prod sh

# Web container
docker exec -it procurement-web-prod sh

# Check files
ls -la /app
cat /app/dist/server.js | head -20
```

#### Resource Usage

```bash
# Container stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a --volumes
```

---

## Maintenance

### Updating Application

#### 1. Pull Latest Code

```bash
git pull origin main
```

#### 2. Rebuild and Deploy

```bash
./scripts/deploy-cloud.sh
```

Or manual:
```bash
./scripts/build.sh prod production
docker-compose -f docker-compose.prod.yml up -d
```

### Database Backup

#### Automated Backup Script

```bash
#!/bin/bash
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Create backup
mysqldump -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} \
  > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

#### Restore Backup

```bash
mysql -h ${DB_HOST} -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < backup.sql
```

### Monitoring

#### Setup Health Check Monitoring

```bash
# Add to crontab
*/5 * * * * curl -f http://localhost:3000/api/health || systemctl restart procurement
```

#### Log Rotation

```bash
# Docker handles logs, but you can configure:
# /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Scaling

#### Vertical Scaling (More Resources)

1. Stop containers: `docker-compose -f docker-compose.prod.yml down`
2. Upgrade server (CPU/RAM)
3. Start containers: `docker-compose -f docker-compose.prod.yml up -d`

#### Horizontal Scaling (PM2 Clustering)

API already uses PM2 clustering inside container (max CPU cores).

For multiple containers, use load balancer:

```bash
# nginx.conf
upstream api_backend {
    server localhost:3000;
    server localhost:3001;
    server localhost:3002;
}
```

---

## Security Best Practices

1. **Use Strong Secrets**: Generate JWT_SECRET with 32+ random characters
2. **Restrict CORS**: Only allow your domain in CORS_ORIGIN
3. **Use HTTPS**: Always use SSL/TLS in production
4. **Firewall**: Limit exposed ports (only 80/443 public)
5. **Update Regularly**: Keep Docker, images, and dependencies updated
6. **Database Security**: Use strong passwords, limit network access
7. **Backup**: Regular automated backups with off-site storage
8. **Monitoring**: Setup health checks and log monitoring

---

## Support

### Useful Commands Reference

```bash
# Build images
./scripts/build.sh [dev|prod] [tag]

# Deploy locally
./scripts/deploy-local.sh

# Deploy production
./scripts/deploy-cloud.sh

# Run migrations
./scripts/migrate.sh

# View logs
docker-compose -f docker-compose.prod.yml logs -f [api|web]

# Restart services
docker-compose -f docker-compose.prod.yml restart [api|web]

# Stop all
docker-compose -f docker-compose.prod.yml down

# Check status
docker-compose -f docker-compose.prod.yml ps

# Health checks
curl http://localhost:3000/api/health
curl http://localhost/health
```

### Directory Structure

```
Procurement/
├── apps/
│   ├── api/
│   │   ├── Dockerfile           # API container config
│   │   ├── drizzle/              # Database schema
│   │   └── src/                 # Source code
│   └── web/
│       ├── Dockerfile           # Web container config
│       ├── nginx.conf           # Nginx config
│       └── src/                 # Frontend code
├── scripts/
│   ├── build.sh                 # Build images
│   ├── deploy-local.sh          # Local deployment
│   ├── deploy-cloud.sh          # Production deployment
│   └── migrate.sh               # Database migrations
├── docker-compose.dev.yml       # Development config
├── docker-compose.prod.yml      # Production config
├── .dockerignore                # Docker ignore patterns
├── .env.example                 # Environment template
└── DEPLOYMENT.md                # This file
```

---

## Changelog

- **v1.0.0** (2024): Initial deployment guide with Docker containerization
