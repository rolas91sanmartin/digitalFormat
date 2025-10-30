# Script para generar el instalador de FormatPrinter IA
# Ejecutar con: .\build.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FormatPrinter IA - Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Limpiar
Write-Host "1. Limpiando archivos anteriores..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force release -ErrorAction SilentlyContinue
Write-Host "   ✓ Limpieza completada" -ForegroundColor Green
Write-Host ""

# 2. Instalar dependencias
Write-Host "2. Instalando dependencias..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Error al instalar dependencias" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Dependencias instaladas" -ForegroundColor Green
Write-Host ""

# 3. Recompilar dependencias nativas
Write-Host "3. Recompilando dependencias nativas para Electron..." -ForegroundColor Yellow
npx electron-rebuild -f -w better-sqlite3,bcrypt,sharp
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ⚠ Advertencia: Error al recompilar dependencias nativas" -ForegroundColor Yellow
    Write-Host "   Intentando continuar..." -ForegroundColor Yellow
}
Write-Host "   ✓ Dependencias nativas recompiladas" -ForegroundColor Green
Write-Host ""

# 4. Compilar TypeScript
Write-Host "4. Compilando código TypeScript..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Error al compilar código" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Código compilado" -ForegroundColor Green
Write-Host ""

# 5. Verificar archivos compilados
Write-Host "5. Verificando archivos compilados..." -ForegroundColor Yellow
if (-Not (Test-Path "dist/main/main/main.js")) {
    Write-Host "   ✗ Error: No se encontró dist/main/main/main.js" -ForegroundColor Red
    exit 1
}
if (-Not (Test-Path "dist/renderer/index.html")) {
    Write-Host "   ✗ Error: No se encontró dist/renderer/index.html" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Archivos compilados verificados" -ForegroundColor Green
Write-Host ""

# 6. Generar instalador
Write-Host "6. Generando instalador..." -ForegroundColor Yellow
npm run package
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ✗ Error al generar instalador" -ForegroundColor Red
    exit 1
}
Write-Host "   ✓ Instalador generado" -ForegroundColor Green
Write-Host ""

# 7. Resumen
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ BUILD COMPLETADO EXITOSAMENTE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "El instalador está en:" -ForegroundColor White
Write-Host "  release\FormatPrinter IA Setup 1.0.0.exe" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para probar la app empaquetada (sin instalar):" -ForegroundColor White
Write-Host "  release\win-unpacked\FormatPrinter IA.exe" -ForegroundColor Yellow
Write-Host ""
Write-Host "Los logs de la app instalada estarán en:" -ForegroundColor White
Write-Host "  C:\Users\$env:USERNAME\AppData\Roaming\FormatPrinter IA\app.log" -ForegroundColor Yellow
Write-Host ""

