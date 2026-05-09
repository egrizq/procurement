# Monorepo Project Instructions for GitHub Copilot

## Project Overview

Project Name: Procurement ERP
Description: A web application for managing procurement processes efficiently. Built as a monorepo using Turborepo.

## Tech Stack

**Monorepo Tooling**
- Turborepo
- npm workspaces

**Frontend (`apps/web`)**
- Vue.js 3 (Composition API)
- Vite
- Tailwind CSS
- Pinia (State Management)
- PrimeVue (UI Components)
- Lucide Icons

**Backend (`apps/api`)**
- Node.js & TypeScript
- Express.js
- Drizzle ORM (MySQL2 driver)
- Zod (Schema Validation)
- Vitest (Testing)
- Pino (Logging)

**Shared Packages (`packages/*`)**
- `packages/types`: Shared TypeScript interfaces and types.
- `packages/validators`: Shared Zod validation schemas.
- `packages/config`: Shared ESLint/TypeScript configurations.

## Monorepo Best Practices

- Always prioritize importing shared logic, types, and validators from local `packages/*` rather than duplicating them in `apps/`.
- Ensure type safety by sharing robust, unified interfaces between the Express API and the Vue frontend.

## General Coding Standards

- Follow the Airbnb JavaScript/TypeScript Style Guide.
- Write clear, concise comments detailing the "why" for complex business logic.
- Use meaningful, domain-driven variable and function names.
- Ensure functional purity where applicable and write modular, reusable code.

## Frontend Best Practices (Vue 3)

- Use Vue 3 `<script setup>` syntax and the Composition API exclusively.
- Use Pinia for global state management.
- Leverage Tailwind CSS for utility-first styling and layout structure.
- Optimize Vue components for performance and reactivity.
- Break UI into granular, reusable `components/base` and `components/layout`.
- Ensure responsive design for all components.

## Backend Best Practices (Express & Drizzle)

- Implement modular route handling in `apps/api/src/modules/` grouping by domain (routes, controllers, repositories).
- Use Drizzle ORM for database queries, enforcing strict types based on schema definitions in `apps/api/src/db/schema/`.
- Validate all incoming request payloads using Zod schemas (preferably shared from `packages/validators`).
- Handle errors gracefully, utilizing Pino for structured application logging.
- Write unit/integration tests for critical module logic with Vitest.

## Folder Structure Summary

```text
apps/
  api/          # Express backend application
    src/db/       # Drizzle schema and migrations
    src/modules/  # Domain-driven features (controllers, repos)
  web/          # Vue.js frontend application
    src/features/ # Feature-based modules (dashboards, orders)
    src/components/ # Shared Vue components
packages/
  types/        # Shared domain types
  validators/   # Shared Zod validation schemas
  config/       # Linting & build configs
```
 