# Procurement ERP - Static Template Implementation

## Overview

A comprehensive procurement ERP system for vessel companies, designed to streamline crew requests and back-office validation processes.

## What Has Been Implemented

### 1. Layout Components

#### Navbar ([components/layout/Navbar.vue](src/components/layout/Navbar.vue))

- Responsive navigation with mobile menu
- User profile dropdown
- Notification system
- Brand logo
- Navigation links

#### Sidebar ([components/layout/Sidebar.vue](src/components/layout/Sidebar.vue))

- Fixed sidebar with smooth transitions
- Collapsible Master Data submenu
- Icons from Lucide Vue
- Active route highlighting
- Mobile overlay support
- Menu items:
  - Profile
  - Vessels
  - Master Data (with children)
    - Items
    - Vendors
    - Category Items
  - Request
  - MOC (Matrix of Comparison)
  - Purchase Order
  - Good Receipt

#### Footer ([components/layout/Footer.vue](src/components/layout/Footer.vue))

- Copyright information
- Quick links (Privacy, Terms, Support)
- Responsive layout

#### MainLayout ([components/layout/MainLayout.vue](src/components/layout/MainLayout.vue))

- Integrates Navbar, Sidebar, Content area, and Footer
- Responsive sidebar toggle
- Proper spacing and transitions

### 2. Master Data Feature

#### Items View ([features/master-data/views/Items.vue](src/features/master-data/views/Items.vue))

- **Features:**
  - Search functionality
  - Category filter
  - Sortable table with columns:
    - Item Code
    - Name
    - Category
    - Unit
    - Stock
    - Status
  - Action buttons (Edit, View, Delete)
  - Pagination
  - Add new item button
  - Color-coded status badges

#### Vendors View ([features/master-data/views/Vendors.vue](src/features/master-data/views/Vendors.vue))

- **Features:**
  - Search functionality
  - Status filter
  - Table columns:
    - Vendor Code
    - Company Name
    - Contact Person
    - Email
    - Phone
    - Rating (5-star system)
    - Status
  - Action buttons (Edit, View, Delete)
  - Pagination
  - Add new vendor button

#### Category Items View ([features/master-data/views/CategoryItems.vue](src/features/master-data/views/CategoryItems.vue))

- **Features:**
  - Search functionality
  - Type filter
  - Table columns:
    - Category Code
    - Name (with color indicator)
    - Type
    - Description
    - Item Count
    - Status
  - Action buttons (Edit, View, Delete)
  - Pagination
  - Add new category button

### 3. Dashboard

#### Dashboard Index ([features/dashboard/views/Index.vue](src/features/dashboard/views/Index.vue))

- **Features:**
  - Welcome header
  - 4 Statistics cards:
    - Total Items
    - Active Vendors
    - Pending Requests
    - Active Vessels
  - Quick actions section
  - Recent activity feed
  - Responsive grid layout

### 4. Placeholder Views

Created placeholder views for future development:

- Profile
- Vessels
- Request
- MOC (Matrix of Comparison)
- Purchase Order
- Good Receipt

## Technology Stack

- **Framework:** Vue.js 3 with Composition API
- **Styling:** Tailwind CSS 4
- **UI Components:** PrimeVue 4
- **Icons:** Lucide Vue Next
- **State Management:** Pinia
- **Routing:** Vue Router
- **Build Tool:** Vite

## Project Structure

```
src/
├── app/
│   ├── App.vue              # Main app component with MainLayout
│   ├── main.js              # App initialization
│   └── router.js            # Route configuration
├── assets/
│   └── styles/
│       └── styles.css       # Global styles
├── components/
│   ├── base/
│   │   └── DataTable.vue    # Reusable data table component
│   └── layout/
│       ├── Footer.vue       # Footer component
│       ├── MainLayout.vue   # Main layout wrapper
│       ├── Navbar.vue       # Top navigation bar
│       └── Sidebar.vue      # Side navigation menu
├── features/
│   ├── dashboard/
│   │   ├── routes.js        # Dashboard routes
│   │   └── views/
│   │       ├── Index.vue           # Dashboard home
│   │       ├── Profile.vue         # Profile page
│   │       ├── Vessels.vue         # Vessels page
│   │       ├── Request.vue         # Request page
│   │       ├── MOC.vue            # MOC page
│   │       ├── PurchaseOrder.vue  # Purchase Order page
│   │       └── GoodReceipt.vue    # Good Receipt page
│   ├── master-data/
│   │   ├── routes.js        # Master data routes
│   │   └── views/
│   │       ├── Items.vue           # Items management
│   │       ├── Vendors.vue         # Vendor management
│   │       └── CategoryItems.vue  # Category management
│   └── token/
│       ├── api.js           # Token API
│       └── store.js         # Token store
├── services/
│   ├── http.js              # HTTP client
│   └── token.js             # Token service
└── utils/
    └── Text.js              # Text utilities
```

## Routing

All routes are configured in their respective feature folders:

- `/` - Dashboard
- `/profile` - User Profile
- `/vessels` - Vessels Management
- `/master-data/items` - Items Management
- `/master-data/vendors` - Vendor Management
- `/master-data/category-items` - Category Items Management
- `/request` - Request Management
- `/moc` - Matrix of Comparison
- `/purchase-order` - Purchase Order
- `/good-receipt` - Good Receipt

## Running the Application

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Design Features

### Color Scheme

- **Primary:** Indigo/Purple gradient
- **Secondary:** Gray scale
- **Accent colors:** Blue, Green, Yellow, Red for status indicators

### Responsive Design

- Mobile-first approach
- Collapsible sidebar on mobile
- Responsive tables
- Adaptive grid layouts

### User Experience

- Smooth transitions and animations
- Hover effects on interactive elements
- Clear visual hierarchy
- Intuitive navigation
- Loading states and feedback

## Mock Data

All views currently use mock data for demonstration purposes. The data structure is designed to be easily replaceable with real API calls.

## Next Steps

1. **API Integration**
   - Connect to backend services
   - Implement CRUD operations
   - Add loading states and error handling

2. **Form Dialogs**
   - Create add/edit forms for each module
   - Implement validation
   - Add success/error notifications

3. **Authentication**
   - User login/logout
   - Role-based access control
   - Protected routes

4. **Advanced Features**
   - Export functionality (CSV, Excel, PDF)
   - Advanced filtering and sorting
   - Batch operations
   - File uploads
   - Real-time notifications

5. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

## Notes

- All components follow the project's coding standards
- Uses Vue 3 Composition API with `<script setup>`
- Follows Airbnb JavaScript Style Guide
- Modular and reusable component architecture
- Accessible and semantic HTML
