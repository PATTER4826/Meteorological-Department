# 🇹🇭 THAI WEATHER & DISASTER AI CENTER
# Production Multi-Stage Dockerfile for Render & Container Deployments

# Stage 1: Build Frontend Assets
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies using npm install (Render-compatible, no npm ci lockfile strictness)
RUN npm install

# Copy application sources
COPY . .

# Build client distribution
RUN npm run build

# Stage 2: Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Production environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy dependency manifests and install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy built web dist and backend sources
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Create data directory for local SQLite / Fallback storage
RUN mkdir -p /app/data

# Expose server port (Render overrides with $PORT dynamically)
EXPOSE 3000

# Start server
CMD ["npm", "start"]
