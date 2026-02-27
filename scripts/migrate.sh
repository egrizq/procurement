#!/bin/bash

# Procurement Application - Database Migration Script
# This script runs Prisma migrations safely with backup prompts

set -e

echo "================================="
echo "Prisma Database Migration"
echo "================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${RED}✗ .env file not found${NC}"
  exit 1
fi

# Load environment variables
source .env

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_NAME" ]; then
    DB_PORT=${DB_PORT:-3306}
    export DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo -e "${BLUE}Database URL constructed from environment variables${NC}"
  else
    echo -e "${RED}✗ DATABASE_URL not set and cannot be constructed${NC}"
    exit 1
  fi
fi

echo -e "${BLUE}Database: ${DB_NAME}${NC}"
echo -e "${BLUE}Host: ${DB_HOST}${NC}"
echo ""

# Check migration status
echo -e "${BLUE}Checking migration status...${NC}"
cd apps/api

npx prisma migrate status || true

echo ""
echo -e "${YELLOW}⚠ Running migrations will modify the database structure${NC}"
read -p "Continue with migration? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Migration cancelled"
  exit 0
fi

# Backup recommendation
echo ""
echo -e "${YELLOW}It is recommended to backup your database before running migrations${NC}"
read -p "Have you backed up your database? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${YELLOW}Please backup your database before continuing${NC}"
  echo ""
  echo "Backup commands:"
  echo "  MySQL/MariaDB: mysqldump -h ${DB_HOST} -u ${DB_USER} -p ${DB_NAME} > backup.sql"
  echo ""
  read -p "Proceed without backup? (y/N): " -n 1 -r
  echo
  
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled"
    exit 0
  fi
fi

# Run migrations
echo ""
echo -e "${BLUE}Running migrations...${NC}"

if npx prisma migrate deploy; then
  echo -e "${GREEN}✓ Migrations completed successfully${NC}"
else
  echo -e "${RED}✗ Migration failed${NC}"
  echo ""
  echo "Troubleshooting:"
  echo "  1. Check database connection"
  echo "  2. Verify DATABASE_URL is correct"
  echo "  3. Ensure database user has sufficient privileges"
  echo "  4. Check migration files in apps/api/prisma/migrations"
  exit 1
fi

# Generate Prisma Client
echo ""
echo -e "${BLUE}Generating Prisma Client...${NC}"
npx prisma generate

echo ""
echo -e "${GREEN}================================="
echo -e "Migration Complete!"
echo -e "=================================${NC}"
echo ""
echo "Next steps:"
echo "  - Test the application to ensure everything works"
echo "  - Monitor logs for any database-related errors"
