# Environment Configuration

This project uses a **centralized `.env` file** at the workspace root.

## Setup

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values:

   ```bash
   # Windows
   notepad .env

   # Linux/Mac
   nano .env
   ```

## Structure

### Single `.env` File Location

```
Procurement/
├── .env              # ← All environment variables here
├── .env.example      # ← Template
├── apps/
│   ├── api/          # Backend loads from root .env
│   └── web/          # Frontend loads from root .env
```

### Backend (API)

The backend loads environment variables from **root `.env`** via dotenv configuration in `server.ts`:

```typescript
dotenvConfig({ path: resolve(__dirname, '../../../.env') });
```

**Variables used:**

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `HOST` - Server host (default: localhost)
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` - Database config
- `DATABASE_URL` - Drizzle connection string
- `JWT_SECRET` - JWT signing secret
- `API_TOKEN_SECRET` - API token header name
- `LOG_LEVEL` - Logging level (info/debug/error)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)

### Frontend (Web)

The frontend loads environment variables from **root `.env`** via Vite's `envDir` configuration:

```javascript
// vite.config.js
export default defineConfig({
  envDir: '../..', // Load from workspace root
});
```

**Variables used (must have `VITE_` prefix):**

- `VITE_API_BASE_URL` - API endpoint URL
- `VITE_TOKEN_SECRET` - Token storage key

## Development

When running development servers, they automatically load from root `.env`:

```bash
# Backend dev (loads root .env)
npm run dev --workspace=@procurement/api

# Frontend dev (loads root .env via envDir)
npm run dev --workspace=@procurement/web
```

## Docker/Production

Docker Compose files also reference the root `.env`:

```yaml
# docker-compose.dev.yml
services:
  api:
    env_file: .env # Loads from root
```

**Important Docker Behavior:**

- **Local development**: API loads `.env` file directly using dotenv
- **Docker containers**: Environment variables are injected by docker-compose (no `.env` file inside container)
- The application automatically detects which method to use

This means:

- ✅ Keep your `.env` file in workspace root (for local dev)
- ✅ Docker Compose reads `.env` and injects variables into containers
- ✅ No need to copy `.env` into Docker images
- ✅ Same code works in both environments

## Why Centralized?

✅ **Single source of truth** - All environment config in one place  
✅ **Easier management** - No duplicate variables across apps  
✅ **Docker-friendly** - Docker Compose uses root .env by default  
✅ **Less confusion** - Clear where to set environment variables

## Migration from Old Structure

If you had separate `.env` files in `apps/api/` or `apps/web/`, they are no longer used. All variables should be in the root `.env` file.
