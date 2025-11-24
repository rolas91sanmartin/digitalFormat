# 🔍 Guía de Debugging para Actualizaciones

## ✅ Cambios implementados

1. **Logs detallados** en todo el flujo de actualizaciones
2. **Botón de debug** en el Dashboard para verificar actualizaciones manualmente
3. **Toast discreto** en lugar de modales molestos
4. **Información del sistema** en cada verificación

---

## 📋 Checklist antes de probar

### 1. Verificar configuración en GitHub

✅ **Repositorio privado con releases públicos:**
- El repo `digitalFormat` debe estar privado
- Los releases deben ser públicos (no pre-release)

✅ **Verificar release existente:**
1. Ve a: https://github.com/rolas91sanmartin/digitalFormat/releases
2. Verifica que exista un release **público** (no draft, no pre-release)
3. Debe tener estos archivos:
   - `FormatPrinter-IA-Setup-1.0.X.exe`
   - `FormatPrinter-IA-1.0.X-portable.exe`
   - `latest.yml` ⭐ (CRÍTICO - es el que verifica las actualizaciones)

### 2. Verificar token de GitHub (GH_TOKEN)

Abre PowerShell y verifica:

```powershell
echo $env:GH_TOKEN
```

Si no aparece nada o aparece vacío:
1. Crea token: https://github.com/settings/tokens/new
2. Permisos: `repo` completo
3. Configura:
```powershell
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'ghp_TU_TOKEN_AQUI', 'User')
```
4. Cierra y abre PowerShell de nuevo

---

## 🧪 Cómo debuggear

### Opción 1: Usar el botón de debug (Recomendado)

1. **Ejecuta la aplicación** (versión empaquetada, NO con `npm run dev`)
2. **Inicia sesión**
3. En el Dashboard, verás un botón **"🔍 Debug Updates"** (azul)
4. **Haz clic** en el botón
5. **Abre DevTools**: `Ctrl+Shift+I` (solo si es desarrollo)
6. Mira la **consola** para ver los logs detallados

**Logs que deberías ver:**

```
🔍 [Update] Verificación manual solicitada
📋 [Update] Información del sistema:
   - Versión actual: 1.0.1
   - Plataforma: win32
   - Arquitectura: x64
   - App empaquetado: true
   - Feed URL: https://github.com/rolas91sanmartin/digitalFormat/releases/...
✅ [Update] Resultado de verificación: {...}
   - Update info: {...}
   - Versión disponible: 1.0.2
```

### Opción 2: Ver logs automáticos al iniciar

1. **Ejecuta la aplicación**
2. **Abre DevTools** inmediatamente
3. **Espera 3 segundos** (la app verifica automáticamente)
4. Mira los **logs en consola**

**Logs esperados:**

```
⏰ [Update] Iniciando verificación automática...
   - App empaquetado: true
📦 [Update] App empaquetado detectado - verificando actualizaciones
🔍 [Update] Verificando actualizaciones...
✅ [Update] Actualización disponible: 1.0.X
```

### Opción 3: Ver logs del archivo (más detallado)

Los logs también se guardan en un archivo:

```
C:\Users\TU_USUARIO\AppData\Roaming\FormatPrinter IA\logs\main.log
```

Ábrelo con Notepad++ o VS Code para ver todo el historial.

---

## 🐛 Problemas comunes y soluciones

### ❌ Error: "Cannot find release"

**Causa:** No existe un release público o está marcado como pre-release

**Solución:**
1. Ve a: https://github.com/rolas91sanmartin/digitalFormat/releases
2. Edita el release
3. **Desmarca** "Set as a pre-release"
4. Asegúrate de que no sea "Draft"
5. Guarda

---

### ❌ Error: "Network error" o "404"

**Causa:** El repositorio es privado y no tienes el token configurado

**Solución:**
1. Configura `GH_TOKEN` (ver arriba)
2. O haz el repo público temporalmente para probar

---

### ❌ Error: "No update available" (pero SÍ hay una versión nueva)

**Causa:** La versión instalada es >= a la publicada

**Verificar:**
```powershell
# En la consola de la app, verás:
# Versión actual: 1.0.X
# Versión disponible: 1.0.Y
```

Si X >= Y, no detectará actualización.

**Solución:**
1. Instala una versión anterior para probar
2. O publica una versión más nueva

---

### ❌ No aparecen logs en la consola

**Causa:** La app está empaquetada y DevTools está deshabilitado

**Solución:**
1. Revisa el archivo de logs: `C:\Users\TU_USUARIO\AppData\Roaming\FormatPrinter IA\logs\main.log`
2. O ejecuta con `npm run dev` (pero recuerda que las actualizaciones NO funcionan en dev)

---

## 📊 Información útil para reportar problemas

Si sigues teniendo problemas, copia estos datos:

```
Versión instalada: [Desde package.json]
Versión en GitHub: [Desde releases]
Repositorio: rolas91sanmartin/digitalFormat
Repositorio privado: Sí/No
Token configurado: Sí/No
App empaquetada: Sí/No
Plataforma: Windows 10/11
```

Y comparte los logs completos de la consola.

---

## 🎯 Flujo correcto esperado

1. ✅ App se abre → Espera 3 segundos
2. ✅ Verifica actualizaciones automáticamente
3. ✅ Si hay actualización → Muestra modal bonito preguntando si descargar
4. ✅ Si NO hay actualización → Silencio (no molesta)
5. ✅ Si hay error de red → Silencio (no molesta)
6. ✅ Usuario hace clic en "🔍 Debug Updates" → Toast con resultado

---

## 🚀 Siguiente paso

Después de debuggear y encontrar el problema:

1. Publica una nueva versión con el fix
2. Retira el botón de debug del Dashboard (opcional, puedes dejarlo)
3. Prueba que las actualizaciones funcionen automáticamente

---

## 📝 Notas importantes

- ⚠️ Las actualizaciones **NO funcionan** en modo desarrollo (`npm run dev`)
- ⚠️ Debes usar la app **empaquetada** (`electron-builder`)
- ⚠️ El primer release debe instalarse **manualmente**
- ✅ Después de eso, todo es automático

---

¡Suerte con el debugging! 🔧

