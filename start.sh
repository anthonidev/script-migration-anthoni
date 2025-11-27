#!/bin/bash

start_time=$(date +%s)

# Check for skip scraping flag
if [[ "$1" == "--skip-scraping" ]]; then
    echo "⏭️  Skipping scraping..."
    export SKIP_SCRAPING=true
fi

# 1. Start Docker Containers
echo "🐳 Starting Docker containers..."
docker-compose up -d --build

# 2. Show logs and wait for completion
echo "⏳ Waiting for migration pipeline to complete..."
docker-compose logs -f app

# Check for success
if docker-compose logs app | grep -q "Pipeline failed"; then
    echo "❌ Pipeline failed."
    exit 1
fi

# 3. Open Prisma Studio
echo "📊 Opening Prisma Studio..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    start http://localhost:5555
elif [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:5555
else
    xdg-open http://localhost:5555
fi

echo "✨ Done! You can view the data in your browser."

end_time=$(date +%s)
duration=$((end_time - start_time))
echo "⏱️  Total execution time: $((duration / 60))m $((duration % 60))s"
