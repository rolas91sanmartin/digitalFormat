# 📦 Exportación e Importación Completa de Formularios

## ✨ Funcionalidad Implementada

Ahora puedes **exportar e importar formularios con TODA su configuración** incluida en un solo archivo JSON.

## 🎯 ¿Qué se exporta ahora?

### ✅ Configuración básica del formulario:
- ✅ Nombre y descripción
- ✅ Imagen de fondo (Base64)
- ✅ Campos editables (fields)
- ✅ Tablas dinámicas (tables)
- ✅ Elementos estáticos (staticElements)
- ✅ Tamaño de página (pageSize)
- ✅ Modo de renderizado (renderMode)

### ⭐ **NUEVO**: Configuración avanzada:
- ✅ **apiConfiguration**: Toda la configuración de API
  - Endpoint y método HTTP
  - Headers personalizados
  - Autenticación (Bearer, API Key, Basic)
  - Formato de datos (structured, flat, custom)
  - Configuración de callbacks (onSuccess, onError)
  
- ✅ **numerationConfig**: Configuración de folio automático
  - Tipo de numeración (sequential, date-based)
  - Prefijo y sufijo
  - Padding (cantidad de ceros)
  - Campo donde se muestra el folio
  
- ✅ **fieldMappings**: Mapeo de campos a la API
  - Relación campo del formulario → campo de la API
  - Transformaciones (uppercase, lowercase, trim)
  - Valores por defecto
  
- ✅ **tableMappings**: Mapeo de tablas a la API
  - Relación tabla del formulario → array en la API
  - Mapeo de columnas
  - Configuración de habilitación por tabla

## 📥 Cómo exportar

### Desde la interfaz:

1. Ve al **Dashboard**
2. Encuentra el formulario que deseas exportar
3. Haz clic en el botón **"📤 Exportar"**
4. Se descargará un archivo JSON con todo, ejemplo:
   ```
   Mi_Formulario_config.json
   ```

### Estructura del archivo exportado:

```json
{
  "version": "1.0",
  "exportDate": "2025-11-22T20:30:00.000Z",
  "template": {
    "name": "Orden de Compra",
    "description": "Formulario para órdenes de compra",
    "backgroundImage": "data:image/png;base64,...",
    "fields": [...],
    "tables": [...],
    "staticElements": [...],
    "pageSize": { "width": 794, "height": 1123 },
    "renderMode": "hybrid",
    
    // ⭐ CONFIGURACIONES COMPLETAS
    "apiConfiguration": {
      "enabled": true,
      "endpoint": "https://api.miempresa.com/ordenes",
      "method": "POST",
      "headers": {
        "Content-Type": "application/json",
        "X-Custom-Header": "valor"
      },
      "authentication": {
        "type": "bearer",
        "token": "tu_token_aqui"
      },
      "dataFormat": "structured",
      "timeout": 30000
    },
    
    "numerationConfig": {
      "enabled": true,
      "type": "sequential",
      "prefix": "OC-",
      "suffix": "",
      "padding": 5,
      "fieldId": "campo_folio_123",
      "autoIncrement": true
    },
    
    "fieldMappings": [
      {
        "fieldId": "campo_nombre_456",
        "apiKey": "customer_name",
        "transform": { "type": "uppercase" }
      },
      {
        "fieldId": "campo_email_789",
        "apiKey": "customer_email",
        "transform": { "type": "lowercase" }
      }
    ],
    
    "tableMappings": [
      {
        "tableId": "tabla_productos_abc",
        "apiKey": "items",
        "enabled": true,
        "columnMappings": [
          {
            "columnId": "col_producto_1",
            "apiKey": "product_name"
          },
          {
            "columnId": "col_cantidad_2",
            "apiKey": "quantity"
          },
          {
            "columnId": "col_precio_3",
            "apiKey": "unit_price"
          }
        ]
      }
    ]
  }
}
```

## 📤 Cómo importar

### Desde la interfaz:

1. Ve al **Dashboard**
2. Haz clic en **"📥 Importar Configuración"**
3. Selecciona el archivo JSON exportado
4. El formulario se creará automáticamente con **TODA su configuración**

### Lo que pasa al importar:

1. ✅ Se crea un nuevo formulario con un nuevo ID
2. ✅ Se copian todos los campos, tablas y elementos
3. ✅ Se restaura la configuración de API completa
4. ✅ Se restaura la configuración de numeración
5. ✅ Se restauran todos los mapeos de campos y tablas
6. ✅ **Listo para usar**: No necesitas reconfigurar nada

## 🎯 Casos de uso

### 1. **Backup completo**
Exporta tus formularios periódicamente para tener respaldo de toda la configuración.

```bash
# Ejemplo de organización:
backups/
  ├── orden_compra_2025-01-15.json
  ├── orden_compra_2025-02-20.json
  └── factura_2025-01-10.json
```

### 2. **Replicación entre ambientes**
Configura un formulario en desarrollo y réplica en producción:

1. Desarrollo: Configura formulario + API + folios
2. Exporta el JSON
3. Producción: Importa el JSON
4. Solo actualiza el endpoint de producción en la configuración

### 3. **Compartir con otros usuarios**
Puedes enviar el JSON a un colega y tendrá exactamente tu misma configuración.

**⚠️ IMPORTANTE**: Si compartes, revisa que no incluya tokens o credenciales sensibles.

### 4. **Migración a otra máquina**
1. Exporta todos tus formularios
2. Instala la app en la nueva máquina
3. Importa los formularios
4. Todo funciona igual

### 5. **Templates reutilizables**
Crea "plantillas maestras" con configuraciones estándar:
- API de tu empresa preconfigurada
- Numeración estándar
- Mapeos comunes

Luego importa y solo cambia lo específico de cada caso.

## 🔒 Consideraciones de seguridad

### ⚠️ El archivo JSON contiene información sensible:

- ❌ Tokens de autenticación
- ❌ API Keys
- ❌ Contraseñas de Basic Auth
- ❌ URLs de APIs internas

### 💡 Recomendaciones:

1. **No compartas archivos JSON públicamente** si contienen credenciales
2. **Revisa el JSON antes de enviarlo** a alguien
3. **Guarda los backups en lugar seguro**
4. **Usa variables de entorno** para credenciales sensibles (próxima versión)

### 🛡️ Para compartir de forma segura:

Si necesitas compartir un formulario sin credenciales:

1. Exporta el formulario
2. Abre el JSON en un editor de texto
3. Busca la sección `apiConfiguration.authentication`
4. Limpia los valores sensibles:

```json
"authentication": {
  "type": "bearer",
  "token": ""  // ← Vacío
}
```

5. El receptor deberá configurar sus propias credenciales

## 📝 Validaciones al importar

El sistema valida:

✅ Que el archivo sea JSON válido  
✅ Que tenga la estructura correcta  
✅ Que contenga al menos el nombre del template  
✅ Que los tipos de datos sean correctos  

Si hay algún error, recibirás un mensaje claro indicando el problema.

## 🔄 Compatibilidad de versiones

- **version**: "1.0" - Versión actual del formato
- En futuras versiones, se mantendrá compatibilidad hacia atrás
- Si importas un archivo de versión futura, puede haber advertencias

## 🎨 Ejemplo completo de flujo

### Escenario: Replicar formulario en otra PC

**En la PC original:**
```
1. Dashboard → Formulario "Orden de Compra"
2. Click en "📤 Exportar"
3. Se descarga: Orden_de_Compra_config.json
4. Enviar archivo por email/USB/red
```

**En la PC nueva:**
```
1. Instalar FormatPrinter IA
2. Crear cuenta o iniciar sesión
3. Dashboard → "📥 Importar Configuración"
4. Seleccionar: Orden_de_Compra_config.json
5. ✅ Listo! Formulario creado con toda su configuración
6. (Opcional) Actualizar endpoint de API si es diferente
```

## 🚀 Mejoras futuras planeadas

- [ ] Importar/Exportar múltiples formularios a la vez
- [ ] Encriptación de credenciales en el JSON
- [ ] Plantillas públicas en marketplace
- [ ] Versionado de configuraciones
- [ ] Diff entre versiones exportadas

## 💡 Tips y trucos

### Tip 1: Nombres descriptivos
Al exportar, el archivo toma el nombre del formulario. Usa nombres descriptivos:
- ✅ `Factura_v2_produccion.json`
- ❌ `template_config.json`

### Tip 2: Documenta tus cambios
Agrega la fecha de exportación en el nombre del archivo para tracking:
```
Factura_2025-01-15_v2.json
```

### Tip 3: Exporta antes de cambios grandes
Antes de modificar configuraciones complejas, exporta como backup:
```
Orden_Compra_BACKUP_antes_de_cambios.json
```

### Tip 4: Repositorio de templates
Crea una carpeta de templates compartidos en tu equipo:
```
\\servidor\compartido\FormatPrinter_Templates\
  ├── Departamento_Ventas\
  │   ├── orden_compra.json
  │   └── cotizacion.json
  └── Departamento_Contabilidad\
      └── factura.json
```

## ❓ FAQ

**P: ¿Puedo editar el JSON manualmente?**  
R: Sí, pero ten cuidado con la sintaxis. Un error puede hacer que la importación falle.

**P: ¿Se puede importar en otra cuenta de usuario?**  
R: Sí, el formulario importado se asigna al usuario que lo importa.

**P: ¿Se importa el historial de folios?**  
R: No, el contador de folios empieza desde cero. Solo se importa la configuración.

**P: ¿Qué pasa si importo un formulario dos veces?**  
R: Se crean dos formularios separados con IDs diferentes. No hay conflicto.

**P: ¿Puedo exportar un formulario sin su imagen de fondo?**  
R: Actualmente no, pero la imagen está en Base64 dentro del JSON.

**P: ¿El archivo JSON es muy grande?**  
R: Depende de la imagen de fondo. Una imagen típica resulta en un JSON de 1-5 MB.

## 📞 Soporte

Si encuentras problemas:
1. Verifica que el JSON sea válido
2. Revisa la consola del navegador (F12) para errores detallados
3. Intenta con un formulario simple primero
4. Contacta al desarrollador con el mensaje de error completo

---

✨ **¡Ahora tus formularios son completamente portables!**

