#!/bin/sh
set -e

echo "🚀 [Vinylflix] Booting unified container on port ${PORT:-10000}..."

cd /app/backend

# 1. Adapt Prisma provider based on DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  case "$DATABASE_URL" in
    postgres://*|postgresql://*)
      echo "🐘 [Database] PostgreSQL connection detected. Configuring Prisma schema..."
      sed -i 's/provider = "sqlite"/provider = "postgresql"/g' prisma/schema.prisma || true
      npx prisma generate || true
      echo "🔄 [Database] Syncing schema with PostgreSQL..."
      npx prisma db push --accept-data-loss || true
      ;;
    *)
      echo "📁 [Database] SQLite / Default connection detected."
      npx prisma generate || true
      npx prisma db push --accept-data-loss || true
      ;;
  esac
fi

# 2. Start Production Express Server (Serving API, Frontend SPA, and Admin SPA + Auto-seeding plans on boot)
echo "✅ [Vinylflix] Starting production web service..."
exec node dist/server.js
