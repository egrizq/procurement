import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Load .env from workspace root BEFORE any other modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../../.env');

// Try to load .env file (for local development)
// In Docker, environment variables are set by docker-compose, so .env file won't exist
if (existsSync(envPath)) {
  dotenvConfig({ path: envPath });
  console.log('✓ Environment variables loaded from:', envPath);
} else {
  console.log('ℹ No .env file found (using environment variables from system/docker-compose)');
}

// Validate critical environment variables
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME) {
  console.error('❌ Missing required environment variables');
  console.error('Required: DB_HOST, DB_USER, DB_NAME');
  console.error(`Tried to load from: ${envPath}`);
  console.error('Make sure .env file exists or environment variables are set');
  process.exit(1);
}
