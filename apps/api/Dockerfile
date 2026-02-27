# Syntax: dockerfile/1
FROM node:20.19.0-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY turbo.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/validators/package*.json ./packages/validators/

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/api ./apps/api
COPY packages/validators ./packages/validators

# Build the application
RUN npm run build --workspace=@procurement/api

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Production stage
FROM node:20.19.0-alpine

# Set working directory
WORKDIR /app

# Install production dependencies for Prisma
RUN apk add --no-cache openssl

# Set NODE_ENV
ENV NODE_ENV=production

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package*.json ./
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/node_modules ./node_modules

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {let data='';r.on('data',c=>data+=c);r.on('end',()=>{try{const j=JSON.parse(data);process.exit(j.status==='ok'?0:1)}catch(e){process.exit(1)}})})" || exit 1

# Start the application
CMD ["node", "dist/server.js"]
