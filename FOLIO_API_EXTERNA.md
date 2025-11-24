# 📋 Generación de Folios: Local vs API Externa

## 🎯 Descripción General

El sistema ahora soporta **dos modos de generación de folios**, permitiendo adaptarse a diferentes escenarios de implementación:

### 💻 **Modo Local**
El folio se genera automáticamente en cada instalación de forma independiente.
- ✅ **Ideal para:** Una sola instalación o cuando no necesitas sincronización entre múltiples equipos
- ✅ **Ventajas:** Simple, rápido, no requiere conectividad
- ⚠️ **Limitación:** Cada instalación genera sus propios folios independientemente

### 🌐 **Modo API Externa**
El folio se solicita a un servidor centralizado del cliente.
- ✅ **Ideal para:** Múltiples instalaciones que necesitan folios únicos centralizados
- ✅ **Ventajas:** Folios únicos garantizados entre todas las instalaciones
- ✅ **Caso de uso:** Cliente instala el sistema en 5 computadoras y necesita que los folios sean únicos en todas ellas

---

## 🛠️ Configuración

### 1. Acceder a la Configuración

1. Ir al **Dashboard**
2. Hacer clic en **"Configurar"** en el formulario deseado
3. En la sección **"Numeración Automática"**, activar la generación de folios

### 2. Seleccionar el Origen del Folio

Se presentarán dos opciones:

#### 💻 **Modo Local** (Por defecto)

```
Configuración requerida:
├─ Tipo: Secuencial o Basado en fecha
├─ Prefijo: Ej: "FORM-"
├─ Sufijo: Ej: "-2024"
├─ Padding: Cantidad de ceros (Ej: 5 = 00001)
├─ Iniciar desde: Número inicial
└─ Campo de destino: Donde se mostrará el folio
```

**Ejemplo de folio generado:** `FORM-00123-2024`

#### 🌐 **Modo API Externa**

```
Configuración requerida:
├─ Endpoint URL: https://api.cliente.com/generate-folio
├─ Método HTTP: GET o POST
├─ Autenticación:
│  ├─ Ninguna
│  ├─ Bearer Token
│  ├─ API Key
│  └─ Basic Auth
├─ Headers Personalizados: (opcional)
├─ Timeout: Tiempo máximo de espera (ms)
├─ Path de Respuesta: Ruta del folio en el JSON
└─ Payload: (solo para POST, opcional)
```

---

## 🌐 Implementación de API Externa

### Endpoint Requerido

Tu servidor debe exponer un endpoint que:
- **Reciba:** Una petición GET o POST
- **Retorne:** Un JSON con el folio generado

### Ejemplos de Respuesta Esperada

#### Ejemplo 1: Respuesta Simple
```json
{
  "folio": "FORM-00145"
}
```
**Configuración:** `Path de Respuesta = "folio"`

#### Ejemplo 2: Respuesta Anidada
```json
{
  "data": {
    "folio": "INV-2024-00789",
    "timestamp": "2024-11-24T10:30:00Z"
  },
  "status": "success"
}
```
**Configuración:** `Path de Respuesta = "data.folio"`

#### Ejemplo 3: Respuesta con Metadata
```json
{
  "success": true,
  "result": {
    "folioNumber": "ORD-20241124-0012"
  }
}
```
**Configuración:** `Path de Respuesta = "result.folioNumber"`

---

## 🔒 Seguridad y Autenticación

### 1. Bearer Token
```
Header enviado:
Authorization: Bearer TU_TOKEN_SECRETO
```

### 2. API Key
```
Header enviado:
X-API-Key: TU_API_KEY
(o el nombre de header personalizado que configures)
```

### 3. Basic Auth
```
Header enviado:
Authorization: Basic base64(usuario:contraseña)
```

---

## 🧪 Prueba de Configuración

### Validación Automática

Al guardar la configuración, el sistema:
1. ✅ Valida que todos los campos requeridos estén completos
2. ✅ Verifica que el endpoint sea accesible (si es modo API)
3. ✅ Muestra una vista previa del folio

### Vista Previa

**Modo Local:** Muestra el próximo folio a generar
```
📋 Próximo folio a generar:
FORM-00124-2024
```

**Modo API:** Indica que se usará API externa
```
📋 Próximo folio a generar:
🌐 Folio generado por API Externa
* El folio será obtenido desde: https://api.cliente.com/generate-folio
```

---

## 📝 Flujo de Trabajo

### Con Modo Local
```
1. Usuario carga el formulario
   ↓
2. Sistema muestra el próximo folio (vista previa)
   ↓
3. Usuario llena el formulario
   ↓
4. Usuario hace clic en "Imprimir"
   ↓
5. Sistema incrementa contador local
   ↓
6. Folio se genera y se inserta en el campo configurado
   ↓
7. Documento se imprime
   ↓
8. Sistema carga el siguiente folio (vista previa para próxima impresión)
```

### Con Modo API Externa
```
1. Usuario carga el formulario
   ↓
2. Sistema solicita folio a la API externa (vista previa)
   ↓
3. Folio se muestra en el campo configurado
   ↓
4. Usuario llena el formulario
   ↓
5. Usuario hace clic en "Imprimir"
   ↓
6. Sistema solicita un NUEVO folio a la API externa
   ↓
7. Folio se inserta en el campo configurado
   ↓
8. Documento se imprime
   ↓
9. Sistema solicita otro folio a la API (vista previa para próxima impresión)
```

---

## ⚠️ Consideraciones Importantes

### Modo API Externa

1. **Conectividad:** Requiere conexión activa a internet/red para generar folios
2. **Timeout:** Si la API no responde en el tiempo configurado (default: 10 segundos), se mostrará un error
3. **Manejo de Errores:** Si falla la generación, se notifica al usuario y NO se imprime el documento
4. **Rendimiento:** Cada impresión requiere una llamada a la API, considera la latencia de tu servidor
5. **Seguridad:** Los tokens/credenciales se almacenan localmente encriptados

### Mejores Prácticas

- ✅ Implementa caché en tu API si es posible para mejorar rendimiento
- ✅ Asegúrate de que tu API sea altamente disponible (99.9% uptime)
- ✅ Implementa logs en tu servidor para auditar la generación de folios
- ✅ Considera implementar un sistema de respaldo si tu API falla
- ✅ Documenta claramente el formato de respuesta esperado para tus integradores

---

## 🔧 Troubleshooting

### Problema: "Error al obtener folio de API externa"

**Posibles causas:**
1. URL del endpoint incorrecta
2. Servidor no responde (timeout)
3. Autenticación incorrecta
4. Path de respuesta mal configurado

**Solución:**
1. Verificar que la URL sea correcta y accesible
2. Probar el endpoint con Postman/curl
3. Revisar que los headers de autenticación sean correctos
4. Validar que el path de respuesta coincida con la estructura JSON

### Problema: "No se encontró el folio en el path"

**Causa:** El `Path de Respuesta` no coincide con la estructura del JSON

**Solución:**
1. Revisar la respuesta exacta de tu API
2. Ajustar el path (Ej: si el JSON es `{"data": {"folio": "123"}}`, el path debe ser `"data.folio"`)

### Problema: Folios duplicados en Modo Local

**Causa:** Múltiples instalaciones generando folios independientes

**Solución:** Cambiar a **Modo API Externa** para centralizar la generación

---

## 💡 Ejemplo de Implementación de API (Node.js)

```javascript
// Servidor simple con Express que genera folios centralizados
const express = require('express');
const app = express();

let currentFolio = 1;

app.get('/generate-folio', (req, res) => {
  const folioNumber = String(currentFolio).padStart(5, '0');
  const folio = `FORM-${folioNumber}`;
  
  currentFolio++; // Incrementar para el siguiente
  
  res.json({
    success: true,
    data: {
      folio: folio,
      generatedAt: new Date().toISOString()
    }
  });
});

app.listen(3000, () => {
  console.log('API de folios corriendo en puerto 3000');
});
```

**Configuración en el sistema:**
- Endpoint: `http://localhost:3000/generate-folio`
- Método: GET
- Path de Respuesta: `data.folio`

---

## 📞 Soporte

Para más información o dudas sobre la implementación, contacta al equipo de desarrollo.

