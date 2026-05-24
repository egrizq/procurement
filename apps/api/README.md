# Backend Procurement System

## Development Setup

### Prerequisites
- Node.js (v18 or higher)
- MySQL/MariaDB
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run database migrations:
```bash
npm run db:push
npm run db:generate
```

4. Start development server:
```bash
npm run dev
```

## Production Deployment with PM2 on EC2

### Initial Setup on EC2

1. Install Node.js and PM2:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

2. Clone repository and install dependencies:
```bash
git clone <your-repo-url>
cd backend-proc
npm install --production
```

3. Configure environment:
```bash
cp .env.example .env
nano .env  # Edit with production values
```

4. Run Drizzle migrations:
```bash
npm run db:push
npm run db:generate
```

### PM2 Commands

Start application in production mode:
```bash
npm run pm2:start
```

Other PM2 commands:
```bash
npm run pm2:stop       # Stop the application
npm run pm2:restart    # Restart the application
npm run pm2:reload     # Zero-downtime reload
npm run pm2:delete     # Remove from PM2
npm run pm2:logs       # View logs
npm run pm2:monit      # Monitor resources
npm run pm2:status     # Check status
```

### PM2 Auto-Startup on System Boot

Configure PM2 to start on system reboot:
```bash
pm2 startup
# Follow the command output instructions
pm2 save
```

### Monitoring

View real-time logs:
```bash
pm2 logs backend-proc
```

Monitor with dashboard:
```bash
pm2 monit
```

Check application status:
```bash
pm2 status
```

### Log Files

PM2 logs are stored in:
- Error logs: `./logs/pm2-error.log`
- Output logs: `./logs/pm2-out.log`

### Configuration

PM2 configuration is in `ecosystem.config.js`:
- Cluster mode with max CPU cores
- Auto-restart on failure
- Memory limit: 500MB per instance
- Graceful shutdown with 5s timeout

## API Endpoints

Base URL: `http://your-domain:3000/api`

### Authentication
- POST `/auth/login` - User login
- POST `/auth/register` - User registration

### Master Data
- `/master-data/items` - Item management
- `/master-data/vendors` - Vendor management
- `/master-data/vessels` - Vessel management

### Vessel Requests
- `/vessel-request` - Procurement requests

## Environment Variables

See `.env.example` for all required environment variables:
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DATABASE_URL` - Drizzle database connection string
- `JWT_SECRET` - JWT signing secret
- `API_TOKEN_SECRET` - API token secret

## Project Structure

```
backend-proc/
├── src/
│   ├── app.js              # Express app configuration
│   ├── server.js           # Server entry point
│   ├── config/             # Configuration files
│   ├── modules/            # Feature modules
│   ├── routes/             # Route definitions
│   └── shared/             # Shared utilities
├── drizzle/
│   ├── schema.drizzle       # Database schema
│   └── migrations/         # Database migrations
├── ecosystem.config.js     # PM2 configuration
├── .env.example            # Environment template
└── package.json            # Dependencies
```

## License

ISC
