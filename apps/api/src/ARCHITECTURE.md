# Architecture - Feature-Based/Domain-Driven Structure

## Struktur Folder

```
src/
├── app.js                      # Express app configuration
├── server.js                   # Server entry point
├── config/                     # Configuration files
│   ├── database.js            # MySQL database pool
│   ├── drizzle.js              # Drizzle client configuration
│   └── logger.js              # Pino logger setup
├── shared/                     # Shared utilities & middlewares
│   ├── middlewares/
│   │   ├── errorHandler.js    # Global error handler
│   │   ├── logger.js          # HTTP request logger
│   │   └── validate.js        # Zod validation middleware
│   └── utils/
│       ├── asyncHandler.js    # Async/await error wrapper
│       ├── error.js           # Custom error class
│       ├── paginate.js        # Pagination helper
│       ├── password.js        # Password hashing utilities
│       └── response.js        # Response formatters
├── modules/                    # Feature modules (domain-driven)
│   ├── auth/                  # Authentication module
│   │   ├── auth.controller.js
│   │   ├── auth.repository.js
│   │   ├── auth.validation.js
│   │   ├── auth.routes.js
│   │   └── auth.middleware.js  # API token authentication
│   ├── api-token/             # API token management
│   │   ├── token.controller.js
│   │   ├── token.repository.js
│   │   ├── token.validation.js
│   │   ├── token.routes.js
│   │   └── token.utils.js      # Token generation & hashing
│   ├── master-data/           # Master data management
│   │   ├── vendors/
│   │   │   ├── vendor.controller.js
│   │   │   ├── vendor.repository.js
│   │   │   └── vendor.routes.js
│   │   ├── items/
│   │   │   ├── item.controller.js
│   │   │   ├── item.repository.js
│   │   │   ├── item.validation.js
│   │   │   └── item.routes.js
│   │   ├── vessels/
│   │   │   └── vessel.repository.js
│   │   └── index.js           # Aggregate master-data routes
│   └── vessel-request/        # Vessel request module
│       ├── vessel-request.controller.js
│       ├── vessel-request.repository.js
│       ├── vessel-request.validation.js
│       └── vessel-request.routes.js
└── routes/
    └── index.js               # Main router aggregator
```

## Keuntungan Struktur Ini

### 1. **High Cohesion**

Semua file yang terkait dengan satu fitur berada dalam satu folder. Misalnya, untuk module `auth`, semua file (controller, repository, validation, routes, middleware) ada di `modules/auth/`.

### 2. **Easy Navigation**

Tidak perlu loncat-loncat antara folder `controllers/`, `repository/`, `validations/`, dll. Semua ada dalam satu tempat.

### 3. **Better Developer Experience**

- Saat develop fitur baru, cukup buat 1 folder baru di `modules/`
- Tidak perlu membuat file di 5-6 folder berbeda
- Lebih mudah untuk mencari dan memodifikasi kode

### 4. **Scalable**

Menambah module baru sangat mudah:

```bash
modules/
  └── new-feature/
      ├── new-feature.controller.js
      ├── new-feature.repository.js
      ├── new-feature.validation.js
      └── new-feature.routes.js
```

### 5. **Clear Separation of Concerns**

- `shared/` → Utilities dan middlewares yang dipakai oleh semua module
- `modules/` → Business logic per feature/domain
- `config/` → Database, logger, dan konfigurasi aplikasi

### 6. **Easier Testing**

Test files bisa diletakkan dekat dengan module yang di-test:

```
modules/
  └── auth/
      ├── auth.controller.js
      ├── auth.controller.test.js
      ├── auth.repository.js
      └── auth.repository.test.js
```

### 7. **Better Code Review**

Reviewer bisa fokus pada satu folder untuk mereview satu feature, tanpa perlu membuka banyak folder berbeda.

## Import Convention

### Relative Imports dalam Module

```javascript
// Dalam modules/auth/auth.controller.js
const authRepo = require("./auth.repository");
const validate = require("./auth.validation");
```

### Import dari Shared

```javascript
const asyncHandler = require("../../shared/utils/asyncHandler");
const AppError = require("../../shared/utils/error");
```

### Import dari Config

```javascript
const drizzle = require("../../config/drizzle");
```

### Import dari Module Lain

```javascript
// Dalam modules/vessel-request/vessel-request.controller.js
const MstItemRepo = require("../master-data/items/item.repository");
const MstVesselRepo = require("../master-data/vessels/vessel.repository");
```

## Routing Structure

```
/api
  ├── /token              → modules/api-token/token.routes.js
  ├── /auth               → modules/auth/auth.routes.js
  ├── /master-data        → modules/master-data/index.js
  │   ├── /vendors        → modules/master-data/vendors/vendor.routes.js
  │   └── /items          → modules/master-data/items/item.routes.js
  └── /vessel-requests    → modules/vessel-request/vessel-request.routes.js
```

## Migration dari Struktur Lama

### Struktur Lama

```
src/
├── controllers/
├── repository/
├── validations/
├── middlewares/
├── utils/
└── routes/
```

### Mapping ke Struktur Baru

- `controllers/` → `modules/{module-name}/{module}.controller.js`
- `repository/` → `modules/{module-name}/{module}.repository.js`
- `validations/` → `modules/{module-name}/{module}.validation.js`
- `routes/` → `modules/{module-name}/{module}.routes.js`
- `middlewares/` → `shared/middlewares/`
- `utils/` → `shared/utils/`
- `libs/` → `config/`

## Best Practices

1. **Naming Convention**: Gunakan kebab-case untuk nama file dan folder
   - ✅ `vessel-request.controller.js`
   - ❌ `vesselRequestController.js`

2. **Module Independence**: Setiap module sebisa mungkin independent
   - Minimize dependencies antar module
   - Jika perlu sharing code, pindahkan ke `shared/`

3. **Single Responsibility**: Satu module = satu domain/feature
   - `auth/` → hanya handle authentication
   - `vessel-request/` → hanya handle vessel requests

4. **Consistency**: Setiap module punya struktur file yang sama
   - `{module}.controller.js`
   - `{module}.repository.js`
   - `{module}.validation.js`
   - `{module}.routes.js`
