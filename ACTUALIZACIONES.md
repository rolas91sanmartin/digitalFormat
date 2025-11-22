# Sistema de Actualizaciones Automáticas

## 📦 Implementación Completada

Se ha integrado **electron-updater** en FormatPrinterIA para manejar actualizaciones automáticas sin necesidad de reinstalar la aplicación.

## ✨ Características

- ✅ Verificación automática de actualizaciones al iniciar la app (solo en producción)
- ✅ Notificaciones visuales elegantes con SweetAlert2
- ✅ Descarga de actualizaciones en segundo plano con barra de progreso
- ✅ Instalación automática al cerrar la aplicación
- ✅ Opción de reiniciar inmediatamente para aplicar la actualización
- ✅ Manejo de errores con retroalimentación al usuario

## 🔧 Configuración

### 1. GitHub Releases (Recomendado)

La aplicación está configurada para usar GitHub Releases como servidor de actualizaciones:

```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "rolas91sanmartin",
        "repo": "FormatPrinterIA"
      }
    ]
  }
}
```

### 2. Configuración de repositorio privado (opcional)

Si tu repositorio es privado, necesitas configurar un token:

1. Crear token de GitHub: https://github.com/settings/tokens
2. Dar permisos de `repo`
3. Configurar variable de entorno:

```bash
# Windows
set GH_TOKEN=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

# Linux/Mac
export GH_TOKEN=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
```

## 🚀 Publicar una nueva versión

### Paso 1: Actualizar la versión

```bash
# Incrementar versión patch (1.0.0 -> 1.0.1)
npm version patch

# O versión minor (1.0.0 -> 1.1.0)
npm version minor

# O versión major (1.0.0 -> 2.0.0)
npm version major
```

### Paso 2: Compilar y publicar

```bash
# Compilar el código
npm run build

# Empaquetar y publicar a GitHub Releases
npx electron-builder --publish always
```

Esto creará:
- Un instalador NSIS (`.exe`)
- Una versión portable (`.exe`)
- Los archivos necesarios para auto-actualización (`.yml`)
- Un release en GitHub con todos los archivos

### Paso 3: Verificar la publicación

1. Ve a: https://github.com/rolas91sanmartin/FormatPrinterIA/releases
2. Verifica que aparezca el nuevo release con todos los archivos

## 📱 Flujo de actualización para el usuario

### En la aplicación instalada:

1. **Al iniciar la app** (después de 3 segundos):
   - Se verifica si hay actualizaciones disponibles
   
2. **Si hay actualización**:
   - Aparece un diálogo elegante mostrando la nueva versión
   - El usuario puede elegir "Descargar ahora" o "Más tarde"

3. **Durante la descarga**:
   - Se muestra un indicador de progreso en la esquina inferior derecha
   - La aplicación sigue siendo completamente funcional

4. **Cuando termina la descarga**:
   - Aparece otro diálogo confirmando que está lista
   - Opciones: "Reiniciar ahora" o "Más tarde"
   - Si elige "Más tarde", se instalará al cerrar la app

5. **Instalación**:
   - La app se cierra y se reinicia automáticamente
   - La nueva versión está lista para usar

## 🔍 Verificación manual de actualizaciones

Aunque la verificación es automática, también puedes implementar un botón manual:

```typescript
// En cualquier componente React
const checkUpdates = async () => {
  const result = await window.electronAPI.checkForUpdates();
  if (result.success) {
    console.log('Verificación completada');
  }
};
```

## 🛠️ Desarrollo local

Para probar actualizaciones en desarrollo:

1. **Generar una build de producción**:
```bash
npm run build
npx electron-builder --dir
```

2. **Ejecutar la app empaquetada** (no con `npm start`)
   - La app verificará actualizaciones solo si está empaquetada

3. **Simular una actualización**:
   - Incrementa la versión en `package.json`
   - Publica a GitHub Releases
   - Ejecuta la versión anterior empaquetada
   - Debería detectar la actualización

## 📋 Archivos modificados

### Backend (Main Process)
- ✅ `package.json` - Configuración de publicación
- ✅ `src/main/main.ts` - Inicialización de auto-updater
- ✅ `src/main/ipc/handlers.ts` - Handlers IPC para actualizaciones
- ✅ `src/main/preload.ts` - API expuesta al renderer

### Frontend (Renderer Process)
- ✅ `src/renderer/src/components/UpdateNotification.tsx` - Componente de notificaciones
- ✅ `src/renderer/src/App.tsx` - Integración del componente

## 🔒 Seguridad

- ✅ El auto-updater **solo funciona en apps empaquetadas**
- ✅ Las actualizaciones se descargan de GitHub Releases (HTTPS)
- ✅ Se verifica la firma digital de los archivos
- ✅ No se ejecuta en modo desarrollo

## ⚠️ Importante

1. **Primera instalación**: Los usuarios deben instalar manualmente la primera versión
2. **Versión portable**: Las versiones portables también se actualizan automáticamente
3. **GitHub Releases**: Asegúrate de que los releases sean públicos o configures el token
4. **Internet**: Requiere conexión a internet para verificar y descargar actualizaciones

## 🎯 Alternativas de distribución

Si no quieres usar GitHub Releases, puedes configurar:

### Servidor propio
```json
{
  "build": {
    "publish": {
      "provider": "generic",
      "url": "https://tu-servidor.com/updates"
    }
  }
}
```

### AWS S3
```json
{
  "build": {
    "publish": {
      "provider": "s3",
      "bucket": "tu-bucket",
      "region": "us-east-1"
    }
  }
}
```

## 📝 Notas de versión

Para agregar notas de versión al release de GitHub:

1. Edita el release en GitHub
2. Agrega las notas en la descripción
3. Las notas aparecerán en el diálogo de actualización

## 🐛 Debugging

Para ver logs de actualización:

1. Abre DevTools (solo en desarrollo)
2. Busca logs que empiecen con `[Update]`
3. Los errores se muestran con `❌ [Update] Error:`

## 📞 Soporte

Si encuentras problemas:
1. Verifica que estés usando una versión empaquetada
2. Verifica conexión a internet
3. Verifica que el release esté disponible en GitHub
4. Revisa los logs en la consola

