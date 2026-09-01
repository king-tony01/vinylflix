#!/bin/sh
set -e

echo "🚀 [Vinylflix] Booting unified container on port ${PORT:-10000}..."

cd /app/backend

# 1. Adapt Prisma provider based on DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    postgres://*|postgresql://*)
      echo "🐘 [Database] PostgreSQL connection detected. Configuring Prisma schema..."
      sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma
      npx prisma generate
      echo "🔄 [Database] Syncing schema with PostgreSQL..."
      npx prisma db push --accept-data-loss
      ;;
    *)
      echo "📁 [Database] SQLite / Default connection detected."
      npx prisma generate
      npx prisma db push --accept-data-loss
      ;;
  esac
fi

# 2. Seed initial admin and platform membership plans if requested or on first run
if [ "$AUTO_SEED" = "true" ] || [ "$AUTO_SEED" = "1" ]; then
  echo "🌱 [Database] Running initial seed for Admin and Standard Plans..."
  npm run prisma:seed || echo "Seed notice: Schema already initialized."
fi

# 3. Start Production Express Server (Serving API, Frontend SPA, and Admin SPA)
echo "✅ [Vinylflix] Starting production web service..."
exec node dist/server.js
