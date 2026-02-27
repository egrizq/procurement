#!/bin/bash

# Procurement Application - Local Development Deployment
# This script deploys the application locally using Docker Compose

set -e

echo "========================================="
echo "Deploying Procurement - Local Environment"
echo "========================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: .env file not found${NC}"
  echo "Creating .env from .env.example..."
  
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Please edit .env file with your configuration before continuing${NC}"
    exit 0
  else
    echo -e "${RED}✗ .env.example not found${NC}"
    exit 1
  fi
fi

# Load environment variables
source .env

# Check if required variables are set
REQUIRED_VARS=("DB_HOST" "DB_USER" "DB_PASSWORD" "DB_NAME" "JWT_SECRET" "API_TOKEN_SECRET")
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
  echo ""
  echo "Please set these variables in your .env file"
  exit 1
fi

echo -e "${BLUE}Environment configuration loaded${NC}"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}✗ Docker is not running${NC}"
  echo "Please start Docker and try again"
  exit 1
fi

# Stop existing containers
echo -e "${BLUE}Stopping existing containers...${NC}"
docker-compose -f docker-compose.dev.yml down

# Build images
echo ""
echo -e "${BLUE}Building Docker images...${NC}"
./scripts/build.sh dev latest

# Run database migrations
echo ""
echo -e "${BLUE}Running database migrations...${NC}"
./scripts/migrate.sh

# Start containers
echo ""
echo -e "${BLUE}Starting containers...${NC}"
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
echo ""
echo -e "${BLUE}Waiting for services to be ready...${NC}"
sleep 5

# Check API health
MAX_RETRIES=30
RETRY_COUNT=0
API_HEALTHY=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
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
  echo "Check logs with: docker-compose -f docker-compose.dev.yml logs api"
  exit 1
fi

# Check Web health
if curl -f http://localhost:80/health > /dev/null 2>&1; then
  echo -e "${GREEN}✓ Web is healthy${NC}"
else
  echo -e "${YELLOW}⚠ Web health check failed (this may be normal during startup)${NC}"
fi

echo ""
echo -e "${GREEN}========================================="
echo -e "Deployment Complete!"
echo -e "=========================================${NC}"
echo ""
echo "Application URLs:"
echo -e "  Frontend: ${BLUE}http://localhost${NC}"
echo -e "  API:      ${BLUE}http://localhost:3000/api${NC}"
echo -e "  Health:   ${BLUE}http://localhost:3000/api/health${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:    docker-compose -f docker-compose.dev.yml logs -f"
echo "  Stop:         docker-compose -f docker-compose.dev.yml down"
echo "  Restart:      docker-compose -f docker-compose.dev.yml restart"
