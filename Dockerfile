# 🇹🇭 THAI WEATHER & DISASTER AI CENTER
# Production Multi-Stage Dockerfile

FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build Vite frontend assets
RUN npm run build

# Production Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package descriptors
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend dist and server codebase
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose dev/production port
EXPOSE 3000

# Launch server with tsx
CMD ["npx", "tsx", "server.ts"]
