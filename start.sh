#!/bin/bash

echo "🚀 Starting Doctoralia Migration Environment..."

# 1. Start Docker
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for Postgres (simple sleep loop as fallback)
echo "⏳ Waiting for Database to be ready..."
sleep 5

# 2. Run Migrations
echo "🔄 Running Prisma Migrations..."
# Retry migration a few times in case DB is still starting
pnpm prisma migrate dev --name init
if [ $? -ne 0 ]; then
    echo "⚠️ Migration failed, retrying in 5 seconds..."
    sleep 5
    pnpm prisma migrate dev --name init
    if [ $? -ne 0 ]; then
        echo "❌ Migration failed."
        exit 1
    fi
fi

# 3. Run Pipeline (Scrape + Seed)
echo "▶️ Running Migration Pipeline..."
pnpm start
if [ $? -ne 0 ]; then
    echo "❌ Pipeline failed."
    exit 1
fi

# 4. Start Prisma Studio
echo "📊 Starting Prisma Studio..."
pnpm prisma studio
