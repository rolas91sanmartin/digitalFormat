# 📦 Instrucciones para Generar el Instalador

## ⚠️ IMPORTANTE: Dependencias Nativas

Esta aplicación usa **dependencias nativas** que deben recompilarse para la versión de Electron:
- `better-sqlite3` (base de datos)
- `bcrypt` (encriptación)
- `sharp` (procesamiento de imágenes)

## 🔧 Pasos para Generar el Instalador

### 1. Limpiar instalación anterior
```bash
# Eliminar node_modules
rm -rf node_modules

# Eliminar package-lock.json
rm package-lock.json

# Eliminar carpeta release anterior
rm -rf release
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Recompilar dependencias nativas para Electron
```bash
npm rebuild better-sqlite3 --build-from-source
npm rebuild bcrypt --build-from-source
npm rebuild sharp --build-from-source
```

O usar electron-rebuild (más fácil):
```bash
npx electron-rebuild -f -w better-sqlite3,bcrypt,sharp
```

### 4. Compilar el código
```bash
npm run build
```

### 5. Generar el instalador
```bash
npm run package
```

El instalador estará en `release/FormatPrinter IA Setup 1.0.0.exe`

## 🐛 Cómo Ver los Logs en Producción

Después de instalar y ejecutar la app, los logs se guardan en:

```
C:\Users\<TuUsuario>\AppData\Roaming\FormatPrinter IA\app.log
```

Para ver los logs en tiempo real:
```powershell
Get-Content "C:\Users\$env:USERNAME\AppData\Roaming\FormatPrinter IA\app.log" -Wait
```

O simplemente abre el archivo con Notepad:
```powershell
notepad "C:\Users\$env:USERNAME\AppData\Roaming\FormatPrinter IA\app.log"
```

## 🔍 DevTools se Abrirán Automáticamente

Configuré la app para que **siempre abra DevTools en producción** mientras debugueas.
Esto te permitirá ver errores de React/Renderer.

Para deshabilitarlo después, elimina esta línea en `src/main/main.ts` (línea 86):
```typescript
mainWindow.webContents.openDevTools({ mode: 'detach' });
```

## 📁 Estructura de Archivos en Producción

Cuando la app está empaquetada, los archivos están en:

```
C:\Program Files\FormatPrinter IA\
├── FormatPrinter IA.exe
└── resources\
    ├── app.asar              (código compilado comprimido)
    └── app.asar.unpacked\    (dependencias nativas desempaquetadas)
        └── node_modules\
            ├── better-sqlite3\
            ├── bcrypt\
            └── sharp\
```

## ⚙️ Configuraciones Importantes

### package.json - Sección build

- **asarUnpack**: Desempaqueta las dependencias nativas del archivo ASAR
- **files**: Incluye `node_modules/**/*` para empaquetar todas las dependencias
- **asar**: true (comprime la app para mejor rendimiento)

## 🚨 Problemas Comunes

### Error: "Cannot find module 'better-sqlite3'"
**Solución**: Recompilar para Electron
```bash
npx electron-rebuild -f -w better-sqlite3
```

### Pantalla en blanco al abrir la app
**Causas posibles**:
1. El HTML no se encuentra → Revisa los logs en `app.log`
2. Error en React → Abre DevTools (F12) en la app
3. Error en la DB → Revisa los logs

**Solución**: Mira el archivo `app.log` para ver la causa exacta.

### La app se cierra inmediatamente
**Solución**: 
1. Ejecuta desde PowerShell para ver errores:
```powershell
& "C:\Program Files\FormatPrinter IA\FormatPrinter IA.exe"
```
2. Revisa el archivo `app.log`

## ✅ Checklist Antes de Empaquetar

- [ ] `npm install` completado sin errores
- [ ] `npx electron-rebuild` ejecutado exitosamente
- [ ] `npm run build` completado sin errores
- [ ] Carpeta `dist/` contiene:
  - [ ] `dist/main/` (código del proceso principal)
  - [ ] `dist/renderer/` con `index.html`
- [ ] Archivo `build/icon.ico` existe (opcional pero recomendado)
- [ ] No hay errores de TypeScript

## 🎯 Script Rápido (Todo en Uno)

Crea un archivo `build.ps1`:

```powershell
# Limpiar
Write-Host "Limpiando..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force release -ErrorAction SilentlyContinue

# Instalar
Write-Host "`nInstalando dependencias..." -ForegroundColor Yellow
npm install

# Recompilar nativas
Write-Host "`nRecompilando dependencias nativas..." -ForegroundColor Yellow
npx electron-rebuild -f -w better-sqlite3,bcrypt,sharp

# Compilar
Write-Host "`nCompilando código..." -ForegroundColor Yellow
npm run build

# Empaquetar
Write-Host "`nGenerando instalador..." -ForegroundColor Yellow
npm run package

Write-Host "`n✅ COMPLETADO! El instalador está en release/" -ForegroundColor Green
```

Ejecuta:
```powershell
.\build.ps1
```

## 📞 Soporte

Si encuentras errores:
1. Revisa `app.log`
2. Abre DevTools en la app (F12)
3. Ejecuta la app desde PowerShell para ver errores del proceso principal

