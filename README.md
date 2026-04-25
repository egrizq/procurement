# Procurement Vessel Management System

**A modern monorepo solution for vessel procurement and inventory management**

[![Node Version](https://img.shields.io/badge/node-%3E%3D20.19.0-brightgreen)](https://nodejs.org)
[![Architecture](https://img.shields.io/badge/architecture-monorepo-blue)](https://turbo.build)
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## Overview

The Procurement Vessel Management System is a comprehensive solution for managing vessel procurement, inventory, and requests. Built with modern web technologies and organized as a Turborepo monorepo, it provides a seamless experience for vessel crews, office staff, and administrators.

### Key Features

- 🚢 **Vessel Management** - Track and manage multiple vessels with detailed information
- 📦 **Inventory Control** - Real-time stock levels per vessel with reorder points
- 📝 **Request Management** - Submit, track, and approve procurement requests
- 👥 **User Management** - Role-based access (Admin, Office, Crew)
- 🏢 **Vendor Management** - Maintain vendor database with categorization
- 📊 **Master Data** - Items, categories, and comprehensive cataloging
- 🔒 **Secure Authentication** - Token-based authentication with device tracking
- 📱 **Responsive UI** - Modern Vue.js interface with PrimeVue components

---

## Architecture

### Technology Stack

#### Backend (API)
- **Runtime:** Node.js v20.19.0 (ESM)
- **Framework:** Express v5.2.1
- **Database:** MySQL/MariaDB with Drizzle ORM v7.3.0
- **Validation:** Zod v4.3.6
- **Logging:** Pino v10.3.0 (structured logging)
- **Security:** bcrypt v6.0.0
- **Process Manager:** PM2 v5.4.3 (cluster mode)

#### Frontend (Web)
- **Framework:** Vue.js v3.5.26 (Composition API)
- **Build Tool:** Vite v7.3.1
- **Styling:** Tailwind CSS v4.1.18
- **UI Library:** PrimeVue v4.5.4
- **State Management:** Pinia v3.0.4
- **HTTP Client:** axios v1.13.4

#### Shared Packages
- **Types:** TypeScript type definitions
- **Validators:** Shared Zod validation schemas
- **Config:** Shared constants and configuration

### Monorepo Structure

```
Procurement/
├── apps/
│   ├── api/                    # Backend application
│   │   ├── src/
│   │   │   ├── modules/        # Feature modules
│   │   │   ├── config/         # Configuration
│   │   │   ├── shared/         # Shared utilities
│   │   │   └── routes/         # Route aggregation
│   │   ├── drizzle/             # Database schema & migrations
│   │   └── package.json
│   │
│   └── web/                    # Frontend application
│       ├── src/
│       │   ├── app/            # App bootstrap
│       │   ├── features/       # Feature modules
│       │   ├── components/     # Shared components
│       │   └── services/       # Services
│       └── package.json
│
├── packages/                   # Shared packages
│   ├── types/                  # TypeScript types
│   ├── config/                 # Shared configuration
│   └── validators/             # Validation schemas
│
├── docs/                       # Documentation
│   ├── MONOREPO-MIGRATION.md
│   ├── DEVELOPMENT.md
│   └── API-REFERENCE.md
│
├── package.json                # Root package.json
├── turbo.json                  # Turborepo configuration
└── README.md                   # This file
```

---

## Quick Start

### Prerequisites

- Node.js v20.19.0 or higher
- npm v10.0.0 or higher
- MySQL v8.0+ or MariaDB v10.5+
- Git

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd Procurement

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# Edit .env files with your configuration:
# - Database connection details
# - JWT secret
# - API token secret
# - Other environment-specific settings

# 4. Set up the database
cd apps/api
npx drizzle-kit push
npx drizzle-kit generate
npm run db:seed  # Optional: seed with sample data
cd ../..

# 5. Start development servers
npm run dev

# Access:
# - API: http://localhost:3000
# - Web: http://localhost:5173
```

### Default Credentials

After seeding (optional), you can login with:
- **Username:** admin
- **Password:** (set during seed)

---

## Development

### Available Commands

```bash
# Development
npm run dev          # Start all apps in development mode
npm run build        # Build all apps and packages
npm run lint         # Lint all code
npm run format       # Format all code with Prettier
npm run clean        # Clean all build artifacts

# API-specific (from apps/api/)
npm run dev          # Start API with nodemon
npm run start        # Start API in production
npm run pm2:start    # Start with PM2 in cluster mode

# Web-specific (from apps/web/)
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Database (from apps/api/)
npx drizzle-kit push      # Create and apply migration
npm run db:push   # Apply migrations (production)
npx drizzle-kit studio           # Open database GUI
npx drizzle-kit generate         # Generate Drizzle Client
npm run db:seed          # Seed database
```

### Development Workflow

1. **Start development servers:**
   ```bash
   npm run dev
   ```

2. **Make changes to code:**
   - API changes auto-reload with nodemon
   - Web changes hot-reload with Vite HMR
   - Package changes trigger rebuilds

3. **Format and lint:**
   ```bash
   npm run format
   npm run lint
   ```

4. **Create feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Commit with conventional commits:**
   ```bash
   git commit -m "feat(api): add new endpoint"
   ```

6. **Test thoroughly:**
   - Test API endpoints
   - Test UI functionality
   - Test integration between frontend and backend

7. **Create pull request**

### Project Guidelines

- **Code Style:** Enforced by Prettier, validated by ESLint
- **Commits:** Follow [Conventional Commits](https://www.conventionalcommits.org/)
- **Branching:** Feature branches from `develop`, merge to `main` for production
- **Documentation:** Update relevant docs with significant changes
- **Testing:** Write tests for new features (when test suite is set up)

---

## Core Modules

### Backend Modules

#### Authentication & Authorization
- Token-based authentication with device tracking
- User login/logout
- Role-based access control (Admin, Office, Crew)

#### Master Data Management
- **Items:** Catalog of procurable items with categories
- **Vendors:** Vendor database with contact information
- **Vessels:** Fleet management with vessel details
- **Categories:** Item categorization

#### Vessel Requests
- Create procurement requests per vessel
- Multi-item requests with quantities
- Approval workflow
- Request status tracking
- Priority management

#### Profile Management
- User profile updates
- Password changes
- User preferences

### Frontend Features

#### Dashboard
- Overview of key metrics
- Recent requests
- Quick actions

#### Master Data Interface
- CRUD operations for items, vendors, vessels
- Search and filtering
- Pagination
- Data validation

#### Request Management
- Create and submit requests
- Track request status
- Approve/reject requests (office/admin)
- View request history

#### Responsive Design
- Mobile-friendly interface
- Touch-optimized controls
- Adaptive layouts

---

## Database Schema

### Core Models

- **User** - System users with roles
- **Vessel** - Fleet vessels
- **Item** - Procurable items
- **ItemCategory** - Item categorization
- **Vendor** - Suppliers
- **VesselStock** - Current inventory per vessel
- **VesselRequest** - Procurement requests
- **VesselRequestItem** - Items in requests
- **ApiToken** - Authentication tokens

### Enums

- **UserType:** ADMIN, OFFICE, CREW
- **UserStatus:** ACTIVE, INACTIVE
- **Department:** DECK, ENGINE, STEWARD, KITCHEN
- **Priority:** LOW, MEDIUM, HIGH, URGENT
- **RequestStatus:** DRAFT, SUBMITTED, APPROVED, REJECTED, PROCESSING, COMPLETED, CANCELLED
- **Unit:** PCS, KG, LITER, BOX, BOTTLE, PACK, METER, SET
- **CategoryVendor:** FOOD, SPARE_PART, CHEMICAL, EQUIPMENT, SERVICE, OTHER

See [src/db/schema/index.ts](apps/api/src/db/schema/index.ts) for full schema definition.

---

## Deployment

### Production Deployment

#### API Deployment

**Using PM2 (recommended):**
```bash
cd apps/api

# Production mode
npm run pm2:start

# Monitor
npm run pm2:status
npm run pm2:logs
npm run pm2:monit
```

**PM2 Configuration** (`apps/api/ecosystem.config.js`):
- Cluster mode with max CPU cores
- Auto-restart on failure
- Memory limit: 500MB per instance
- Graceful shutdown: 5s timeout

#### Web Deployment

```bash
cd apps/web
npm run build

# Output in dist/
# Deploy to web server (Nginx, Apache, etc.)
```

**Nginx Configuration Example:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables

#### API (.env)
```env
NODE_ENV=production
PORT=3000
HOST=localhost

# Database
DATABASE_URL="mysql://user:password@localhost:3306/procurement"
DB_HOST=localhost
DB_USER=procurement_user
DB_PASSWORD=your_password
DB_NAME=procurement
DB_PORT=3306

# Security
JWT_SECRET=your_jwt_secret_here
API_TOKEN_SECRET=your_api_token_secret_here
```

#### Web (.env)
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_TOKEN_SECRET=procurement_token
```

---

## Documentation

Comprehensive documentation is available in the `/docs` directory:

- **[MONOREPO-MIGRATION.md](./MONOREPO-MIGRATION.md)** - Complete migration plan from client-server to monorepo
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Detailed development guide
- **[API-REFERENCE.md](./docs/API-REFERENCE.md)** - API endpoint documentation
- **[ARCHITECTURE.md](./apps/api/src/ARCHITECTURE.md)** - Backend architecture details
- **[IMPLEMENTATION.md](./apps/web/IMPLEMENTATION.md)** - Frontend implementation details

---

## Monorepo Benefits

This project uses **Turborepo** for monorepo management, providing:

- ✅ **Unified Development** - Single repository, single command to start everything
- ✅ **Shared Code** - Types, validators, and config shared between backend and frontend
- ✅ **Faster Builds** - Intelligent caching with Turborepo
- ✅ **Type Safety** - Shared TypeScript types ensure API contract consistency
- ✅ **Atomic Changes** - Update API and frontend in single commit
- ✅ **Better Tooling** - Unified linting, formatting, and testing

---

## Contributing

### Getting Started

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Format code: `npm run format`
5. Lint code: `npm run lint`
6. Commit changes: `git commit -m 'feat: add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open pull request

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding/updating tests
- `chore` - Build process or tooling changes

**Scopes:**
- `api` - Backend API
- `web` - Frontend
- `types` - Types package
- `validators` - Validators package
- `config` - Config package
- `db` - Database
- `deps` - Dependencies

**Examples:**
```
feat(api): add vessel approval endpoint
fix(web): resolve token expiration handling
docs(readme): update installation instructions
refactor(validators): extract common schemas
chore(deps): upgrade Drizzle to v7.3.1
```

---

## Testing

### Current Status

Testing infrastructure is planned for future implementation.

### Planned Testing Strategy

- **Unit Tests:** Vitest for API and Web
- **Integration Tests:** Supertest for API endpoints
- **E2E Tests:** Playwright for user flows
- **Coverage Goal:** >80% code coverage

---

## Roadmap

### Phase 1: Turborepo Migration ✅
- [x] Set up Turborepo structure
- [x] Migrate backend to ESM
- [x] Create shared packages
- [x] Unified tooling and configuration

### Phase 2: Testing Infrastructure 🔄
- [ ] Set up Vitest
- [ ] Write unit tests for critical modules
- [ ] Add integration tests
- [ ] Set up E2E testing with Playwright

### Phase 3: Enhanced Features 📋
- [ ] Purchase order management
- [ ] Good receipt tracking
- [ ] Advanced reporting
- [ ] PDF generation for documents
- [ ] Email notifications
- [ ] File attachments for requests

### Phase 4: Performance & Optimization 📋
- [ ] API response caching
- [ ] Database query optimization
- [ ] Frontend code splitting
- [ ] Image optimization
- [ ] PWA capabilities

### Phase 5: DevOps & CI/CD 📋
- [ ] GitHub Actions workflow
- [ ] Automated testing pipeline
- [ ] Automated deployments
- [ ] Docker containerization
- [ ] Kubernetes orchestration (if needed)

---

## Troubleshooting

### Common Issues

**Port Already in Use:**
```bash
# Find and kill process
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

**Database Connection Failed:**
```bash
# Check MySQL running
sudo systemctl status mysql  # Linux
brew services list  # macOS

# Test connection
mysql -u procurement_user -p procurement
```

**Module Not Found:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
rm -rf apps/*/node_modules packages/*/node_modules
npm install
```

**Drizzle Client Not Generated:**
```bash
cd apps/api
npx drizzle-kit generate
```

For more troubleshooting, see [DEVELOPMENT.md](./DEVELOPMENT.md#troubleshooting).

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For questions, issues, or contributions:
- Create an issue on GitHub
- Contact the development team
- Refer to documentation in `/docs` directory

---

## Acknowledgments

- **Turborepo** - Monorepo management
- **Drizzle** - Database ORM
- **Vue.js** - Frontend framework
- **PrimeVue** - UI components
- **Express** - Backend framework

---

**Built with ❤️ for efficient vessel procurement management**
