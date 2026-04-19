#!/bin/bash
# Description: Minimal bash script to run Drizzle migrations

echo "[Migrate] Starting Drizzle migration..."

cd ../apps/api || exit 1
npx drizzle-kit push

if [ $? -eq 0 ]; then
  echo "[Migrate] Migration deployed successfully!"
else
  echo "[Migrate] Error deploying database migrations"
  exit 1
fi
