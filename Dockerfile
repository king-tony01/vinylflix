# ==========================================
# Multi-Stage Production Dockerfile for Vinylflix
# Deploys Backend API + Frontend SPA + Admin SPA at once
# Optimized for Render, Railway, Fly.io, and Docker
# ==========================================

# ------------------------------------------
# Stage 1: Build Frontend (Client SPA)
# ------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ------------------------------------------
# Stage 2: Build Admin (Governance SPA)
# ------------------------------------------
FROM node:20-alpine AS admin-builder
WORKDIR /app/admin

COPY admin/package*.json ./
RUN npm ci

COPY admin/ ./
ENV VITE_BASE_PATH=/admin/
RUN npm run build

# ------------------------------------------
# Stage 3: Build Backend (Node.js + Prisma)
# ------------------------------------------
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Install OpenSSL for Prisma engines
RUN apk add --no-cache openssl

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ------------------------------------------
# Stage 4: Production Runtime Image
# ------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies (OpenSSL for Prisma engine)
RUN apk add --no-cache openssl bash curl

ENV NODE_ENV=production
ENV PORT=10000

# Copy backend package and install production dependencies only
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled backend code and Prisma assets
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/prisma ./prisma
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma ./node_modules/@prisma

# Copy built Frontend and Admin static distributions
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist
COPY --from=admin-builder /app/admin/dist /app/admin/dist

# Copy entrypoint startup script
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 10000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
