# Script para iniciar la aplicación Chat Web
# Ejecuta este script con: .\iniciar.ps1

Write-Host "🚀 Iniciando Chat Web..." -ForegroundColor Cyan
Write-Host ""

# Verificar que existe el archivo .env
if (-not (Test-Path "server\.env")) {
    Write-Host "⚠️  ADVERTENCIA: No se encontró server\.env" -ForegroundColor Yellow
    Write-Host "   Creando archivo .env desde env.example..." -ForegroundColor Yellow
    Copy-Item "server\env.example" "server\.env"
    Write-Host "   Por favor, edita server\.env y agrega tu URL de webhook de n8n" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar dependencias del servidor
if (-not (Test-Path "server\node_modules")) {
    Write-Host "📦 Instalando dependencias del servidor..." -ForegroundColor Yellow
    Set-Location server
    npm install
    Set-Location ..
    Write-Host "✅ Dependencias del servidor instaladas" -ForegroundColor Green
    Write-Host ""
}

# Verificar dependencias del cliente
if (-not (Test-Path "client\node_modules")) {
    Write-Host "📦 Instalando dependencias del cliente..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
    Write-Host "✅ Dependencias del cliente instaladas" -ForegroundColor Green
    Write-Host ""
}

Write-Host "⚠️  IMPORTANTE: Necesitas DOS terminales abiertas" -ForegroundColor Yellow
Write-Host ""
Write-Host "Terminal 1 - Ejecuta:" -ForegroundColor Cyan
Write-Host "  cd server" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Terminal 2 - Ejecuta:" -ForegroundColor Cyan
Write-Host "  cd client" -ForegroundColor White
Write-Host "  npm start" -ForegroundColor White
Write-Host ""
Write-Host "Luego abre: http://localhost:3000" -ForegroundColor Green
Write-Host ""

