#!/bin/bash

# Procurement Application - Build Docker Images
# This script builds both API and Web Docker images

set -e

echo "=================================="
echo "Building Procurement Docker Images"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
BUILD_ENV=${1:-prod}
TAG=${2:-latest}

echo -e "${BLUE}Build Environment: ${BUILD_ENV}${NC}"
echo -e "${BLUE}Tag: ${TAG}${NC}"
echo ""

# Build API image
echo -e "${BLUE}Building API image...${NC}"
docker build -f apps/api/Dockerfile -t procurement-api:${TAG} .
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ API image built successfully${NC}"
else
  echo -e "${RED}✗ API image build failed${NC}"
  exit 1
fi

echo ""

# Set build args for Web image based on environment
if [ "$BUILD_ENV" = "prod" ]; then
  # For production, these should be set in .env file or passed as arguments
  VITE_API_BASE_URL=${VITE_API_BASE_URL:-"/api"}
  VITE_TOKEN_SECRET=${VITE_TOKEN_SECRET:-"x-api-token"}
else
  # For development/local
  VITE_API_BASE_URL=${VITE_API_BASE_URL:-"http://localhost:3000/api"}
  VITE_TOKEN_SECRET=${VITE_TOKEN_SECRET:-"x-api-token"}
fi

# Build Web image
echo -e "${BLUE}Building Web image...${NC}"
docker build \
  -f apps/web/Dockerfile \
  --build-arg VITE_API_BASE_URL=${VITE_API_BASE_URL} \
  --build-arg VITE_TOKEN_SECRET=${VITE_TOKEN_SECRET} \
  -t procurement-web:${TAG} .

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✓ Web image built successfully${NC}"
else
  echo -e "${RED}✗ Web image build failed${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}=================================="
echo -e "Build Complete!"
echo -e "==================================${NC}"
echo ""
echo "Images created:"
echo "  - procurement-api:${TAG}"
echo "  - procurement-web:${TAG}"
echo ""
echo "To run the application:"
echo "  Development: docker-compose -f docker-compose.dev.yml up -d"
echo "  Production:  docker-compose -f docker-compose.prod.yml up -d"
