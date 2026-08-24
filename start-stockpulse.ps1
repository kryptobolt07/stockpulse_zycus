# StockPulse 1-Click Fullstack Launcher
param(
    [switch]$NoBrowser
)

$rootPath = $PSScriptRoot
if (-not $rootPath) { $rootPath = Get-Location }

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "   ⚡ STOCKPULSE : 1-CLICK FULLSTACK LAUNCHER" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Start Backend in separate PowerShell terminal window
$backendPath = Join-Path $rootPath "backend"
Write-Host "[1/3] Starting Spring Boot Backend (Port 8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; Write-Host '⚡ Starting StockPulse Spring Boot Backend...' -ForegroundColor Cyan; mvn spring-boot:run"

# 2. Start Frontend in separate PowerShell terminal window
$frontendPath = Join-Path $rootPath "frontend"
Write-Host "[2/3] Starting React 18 + Vite Frontend (Port 5173)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host '⚡ Starting StockPulse Vite Frontend...' -ForegroundColor Cyan; npm run dev"

# 3. Output Live Endpoint URLs & Links
Write-Host "[3/3] Initializing System Telemetry & Endpoints..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "   🚀 STOCKPULSE ENTERPRISE CONSOLE IS RUNNING!" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   🌐 ACTIVE APPLICATION LINKS:" -ForegroundColor White
Write-Host "   --------------------------------------------------------------------" -ForegroundColor Gray
Write-Host "   💻 React 18 Merchandising Console: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   🧪 Autonomous Simulation Lab:     http://localhost:5173 (Tab: 'Simulation (1d=1m)')" -ForegroundColor Cyan
Write-Host "   🛠️ Interactive API Explorer:       http://localhost:5173 (Tab: 'API Explorer')" -ForegroundColor Cyan
Write-Host "   ☕ Spring Boot REST Backend:       http://localhost:8080" -ForegroundColor Yellow
Write-Host "   📊 Telemetry & Health Dashboard:   http://localhost:8080/api/analytics/dashboard" -ForegroundColor Yellow
Write-Host "   ⚡ Real-Time SSE Stream:          http://localhost:8080/api/events/stream" -ForegroundColor Yellow
Write-Host "   🗄️ H2 In-Memory Database Console: http://localhost:8080/h2-console" -ForegroundColor Magenta
Write-Host "      (JDBC URL: jdbc:h2:mem:stockpulsedb | User: sa | Password: [blank])" -ForegroundColor Gray
Write-Host "   --------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""
Write-Host "   💡 Both processes are running in their respective background windows." -ForegroundColor Gray
Write-Host "      Close the popup windows or press Ctrl+C in them to stop servers." -ForegroundColor Gray
Write-Host "========================================================================" -ForegroundColor Green
Write-Host ""

if (-not $NoBrowser) {
    Start-Process "http://localhost:5173"
}
