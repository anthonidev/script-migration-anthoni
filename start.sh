#!/bin/bash

# 1. Start Docker Containers
echo "🐳 Starting Docker containers..."
docker-compose up -d --build

# 2. Wait for Pipeline to Complete
echo "⏳ Waiting for migration pipeline to complete..."
echo "   (This may take a minute. You can check logs with 'docker-compose logs -f app')"

# Loop to check for completion
while true; do
    if docker-compose logs app | grep -q "Process completed successfully"; then
        echo "✅ Pipeline completed successfully!"
        break
    fi
    if docker-compose logs app | grep -q "Pipeline failed"; then
        echo "❌ Pipeline failed. Check logs:"
        docker-compose logs app
        exit 1
    fi
    sleep 2
done

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
