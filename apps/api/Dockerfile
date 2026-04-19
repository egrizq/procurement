FROM node:20-alpine AS builder
# Set working directory
WORKDIR /app
# Copy package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/validators/package*.json ./packages/validators/
# Install dependencies
RUN npm ci
# Copy source code
COPY apps/api ./apps/api
COPY packages ./packages
# Build the API
WORKDIR /app/apps/api
RUN npm run build
FROM node:20-alpine AS runner
WORKDIR /app
# Copy built artifacts and necessary files
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/ecosystem.config.js ./
COPY --from=builder /app/apps/api/drizzle.config.ts ./
COPY --from=builder /app/apps/api/src/db ./src/db
COPY --from=builder /app/node_modules ./node_modules
# Install global PM2
RUN npm install pm2 -g
EXPOSE 3000
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
