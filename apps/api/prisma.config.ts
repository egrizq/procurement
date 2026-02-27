import { config as dotenvConfig } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { existsSync } from 'fs';

// Load .env from workspace root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, '../../.env');

// Try to load .env file if it exists (for local development)
// In Docker, environment variables are already set by docker-compose
if (existsSync(envPath)) {
  dotenvConfig({ path: envPath });
}

if (!process.env.DATABASE_URL) {
  throw new Error(`DATABASE_URL not found. Checked: ${envPath}. Make sure .env exists or DATABASE_URL is set.`);
}
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env["DATABASE_URL"],
    },
});
