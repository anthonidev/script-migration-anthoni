param([switch]$SkipScraping)

$startTime = Get-Date

if ($SkipScraping) {
    Write-Host "⏭️  Skipping scraping..."
    $env:SKIP_SCRAPING = "true"
}

# 1. Start Docker Containers
Write-Host "🐳 Starting Docker containers..."
docker-compose up -d --build

# 2. Show logs and wait for completion
Write-Host "⏳ Waiting for migration pipeline to complete..."
docker-compose logs -f app

# Check for success
$logs = docker-compose logs app
if ($logs -match "Pipeline failed") {
    Write-Host "❌ Pipeline failed."
    exit 1
}

# 3. Open Prisma Studio
Write-Host "📊 Opening Prisma Studio..."
Start-Process "http://localhost:5555"

Write-Host "✨ Done! You can view the data in your browser."

$endTime = Get-Date
$duration = $endTime - $startTime
Write-Host "⏱️  Total execution time: $($duration.Minutes)m $($duration.Seconds)s"
