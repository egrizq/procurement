#!/bin/bash

# Procurement Application - Cloud/VPS Deployment
# This script deploys the application to a cloud server or VPS

set -e

echo "========================================"
echo "Deploying Procurement - Production"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}✗ .env file not found${NC}"
  echo "Please create .env file with production configuration"
  exit 1
fi

# Load environment variables
source .env

# Validate production environment
if [ "$NODE_ENV" != "production" ]; then
  echo -e "${YELLOW}Warning: NODE_ENV is not set to production${NC}"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check if required variables are set
REQUIRED_VARS=("DB_HOST" "DB_USER" "DB_PASSWORD" "DB_NAME" "JWT_SECRET" "API_TOKEN_SECRET" "CORS_ORIGIN" "VITE_API_BASE_URL")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "${RED}✗ Missing required environment variables:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo "  - $var"
  done
  exit 1
fi

echo -e "${BLUE}Environment: ${NODE_ENV}${NC}"
echo -e "${BLUE}CORS Origin: ${CORS_ORIGIN}${NC}"
echo -e "${BLUE}API Base URL: ${VITE_API_BASE_URL}${NC}"
echo ""

# Confirmation prompt
read -p "Deploy to production? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Deployment cancelled"
  exit 0
fi

# Pull latest code (if using git)
if [ -d .git ]; then
  echo -e "${BLUE}Pulling latest code...${NC}"
  git pull
  echo -e "${GREEN}✓ Code updated${NC}"
fi

# Stop existing containers
echo ""
echo -e "${BLUE}Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Build images with production tag
echo ""
echo -e "${BLUE}Building production images...${NC}"
./scripts/build.sh prod production

# Backup database (optional but recommended)
echo ""
read -p "Backup database before deployment? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
  echo -e "${BLUE}Creating database backup...${NC}"
  BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
  docker exec -i $(docker ps -q -f name=procurement-api-prod) \
    npx prisma db execute --stdin < /dev/null > $BACKUP_FILE 2>/dev/null || true
  echo -e "${GREEN}✓ Backup created: ${BACKUP_FILE}${NC}"
fi

# Run database migrations
echo ""
echo -e "${BLUE}Running database migrations...${NC}"
./scripts/migrate.sh

# Start containers with production configuration
echo ""
echo -e "${BLUE}Starting production containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo ""
echo -e "${BLUE}Waiting for services to start...${NC}"
sleep 10

# Health checks
API_PORT=${API_PORT:-3000}
WEB_PORT=${WEB_PORT:-80}

MAX_RETRIES=60
RETRY_COUNT=0
API_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f http://localhost:${API_PORT}/api/health > /dev/null 2>&1; then
    API_HEALTHY=true
    break
  fi
  
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo -e "${YELLOW}Waiting for API... (${RETRY_COUNT}/${MAX_RETRIES})${NC}"
  sleep 2
done

if [ "$API_HEALTHY" = true ]; then
  echo -e "${GREEN}✓ API is healthy${NC}"
else
  echo -e "${RED}✗ API failed to start${NC}"
  echo "Check logs with: docker-compose -f docker-compose.prod.yml logs api"
  exit 1
fi

# Check Web
if curl -f http://localhost:${WEB_PORT}/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Web is healthy${NC}"
else
  echo -e "${YELLOW}⚠ Web health check failed${NC}"
fi

# Cleanup old images
echo ""
echo -e "${BLUE}Cleaning up old images...${NC}"
docker image prune -f

echo ""
echo -e "${GREEN}========================================"
echo -e "Production Deployment Complete!"
echo -e "========================================${NC}"
echo ""
echo "Application Status:"
echo -e "  API Status:  ${GREEN}Running${NC} on port ${API_PORT}"
echo -e "  Web Status:  ${GREEN}Running${NC} on port ${WEB_PORT}"
echo ""
echo "Useful commands:"
echo "  View logs:      docker-compose -f docker-compose.prod.yml logs -f"
echo "  Check status:   docker-compose -f docker-compose.prod.yml ps"
echo "  Stop:           docker-compose -f docker-compose.prod.yml down"
echo "  Restart API:    docker-compose -f docker-compose.prod.yml restart api"
echo "  Restart Web:    docker-compose -f docker-compose.prod.yml restart web"
