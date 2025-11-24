# 📡 Modo de Folio: API Response

## 🎯 Descripción General

Este documento describe el **tercer modo de generación de folios**: **API Response**, donde el folio es retornado por la API que guarda los datos del formulario.

---

## 🌟 Tres Modos de Folio Disponibles

### 1. 💻 **Local**
- El sistema genera el folio automáticamente
- Ideal para una sola instalación
- Folio visible antes de imprimir

### 2. 🌐 **API Externa**
- Un endpoint dedicado genera el folio
- Ideal para múltiples instalaciones con folios centralizados
- Folio visible antes de imprimir

### 3. 📡 **API Response** (NUEVO)
- El folio viene en la respuesta de la API que guarda los datos
- Ideal cuando tu sistema externo genera folios únicos al guardar
- **El folio NO se ve hasta después de enviar/imprimir**

---

## 🔄 Flujo del Modo "API Response"

```
Usuario llena el formulario
   ↓
Campo del folio muestra: "(se generará al imprimir)"
   ↓
Usuario hace clic en "Imprimir"
   ↓
Sistema confirma con el usuario
   ↓
📤 Sistema envía los datos a tu API (POST /api/forms)
   ↓
🔄 Tu API procesa, guarda y asigna un folio
   ↓
📨 Tu API responde: {"success": true, "data": {"folio": "ORD-12345"}}
   ↓
🔍 Sistema extrae el folio usando el path configurado
   ↓
📝 Sistema actualiza el campo con "ORD-12345"
   ↓
🖨️ Sistema imprime el documento con ese folio
   ↓
✅ Campo se resetea a "(se generará al imprimir)" para el siguiente
```

---

## ⚙️ Configuración

### 1. Requisitos Previos

- ✅ Tener la **API de guardado configurada** (en la misma página de configuración)
- ✅ Tu API debe **retornar el folio** en su respuesta JSON

### 2. Pasos de Configuración

1. **Ir a Dashboard** → Seleccionar formulario → **"Configurar"**

2. **Habilitar Numeración Automática**

3. **Seleccionar "📡 Respuesta de API"**

4. **Configurar el Path del Folio**
   - Ejemplo: Si tu API responde:
   ```json
   {
     "success": true,
     "data": {
       "folio": "ORD-00145",
       "timestamp": "2024-11-24"
     }
   }
   ```
   - Path a configurar: `data.folio`

5. **Seleccionar el campo** donde se mostrará el folio

6. **Guardar configuración**

---

## 📝 Ejemplos de Respuesta de API

### Ejemplo 1: Respuesta Simple

```json
{
  "folio": "FORM-00123"
}
```
**Path:** `folio`

### Ejemplo 2: Respuesta Anidada (Recomendado)

```json
{
  "success": true,
  "message": "Formulario guardado correctamente",
  "data": {
    "id": 456,
    "folio": "ORD-2024-00789",
    "timestamp": "2024-11-24T10:30:00Z"
  }
}
```
**Path:** `data.folio`

### Ejemplo 3: Con Metadatos

```json
{
  "status": "success",
  "result": {
    "formId": 123,
    "folioNumber": "INV-12345",
    "createdAt": "2024-11-24",
    "createdBy": "user@example.com"
  }
}
```
**Path:** `result.folioNumber`

---

## 🛠️ Implementación del Servidor (Ejemplos)

### Node.js / Express

```javascript
const express = require('express');
const app = express();
app.use(express.json());

let folioCounter = 1; // En producción, esto vendría de tu base de datos

app.post('/api/forms', async (req, res) => {
  try {
    const formData = req.body;
    
    // 1. Generar folio único
    const folio = `ORD-${String(folioCounter).padStart(5, '0')}`;
    folioCounter++;
    
    // 2. Guardar en base de datos
    await db.forms.create({
      folio: folio,
      data: formData,
      createdAt: new Date()
    });
    
    // 3. Retornar respuesta CON el folio
    res.json({
      success: true,
      message: 'Formulario guardado',
      data: {
        folio: folio,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Python / FastAPI

```python
from fastapi import FastAPI
from pydantic import BaseModel
from datetime import datetime

app = FastAPI()
folio_counter = 1  # En producción, usar base de datos

class FormData(BaseModel):
    fields: dict
    tables: dict = None

@app.post("/api/forms")
async def save_form(data: FormData):
    global folio_counter
    
    # 1. Generar folio único
    folio = f"ORD-{folio_counter:05d}"
    folio_counter += 1
    
    # 2. Guardar en base de datos
    # await db.save_form(folio, data)
    
    # 3. Retornar respuesta CON el folio
    return {
        "success": True,
        "message": "Formulario guardado",
        "data": {
            "folio": folio,
            "timestamp": datetime.now().isoformat()
        }
    }
```

### PHP / Laravel

```php
Route::post('/api/forms', function (Request $request) {
    // 1. Generar folio único
    $lastFolio = Form::max('id') ?? 0;
    $folio = 'ORD-' . str_pad($lastFolio + 1, 5, '0', STR_PAD_LEFT);
    
    // 2. Guardar en base de datos
    $form = Form::create([
        'folio' => $folio,
        'data' => $request->all(),
        'created_at' => now()
    ]);
    
    // 3. Retornar respuesta CON el folio
    return response()->json([
        'success' => true,
        'message' => 'Formulario guardado',
        'data' => [
            'folio' => $folio,
            'timestamp' => now()->toIso8601String()
        ]
    ]);
});
```

---

## ⚠️ Consideraciones Importantes

### 1. **Validación de la API**

Tu API DEBE:
- ✅ Retornar un código HTTP 200 (éxito)
- ✅ Incluir el folio en la respuesta JSON
- ✅ Usar un formato consistente
- ❌ NO debe fallar al generar el folio

### 2. **Manejo de Errores**

Si tu API falla:
- El sistema mostrará un mensaje de error
- El documento NO se imprimirá
- El usuario puede reintentar

### 3. **Folios Únicos**

Asegúrate de que tu API:
- Genere folios únicos (usar auto-increment o UUID)
- No reutilice folios
- Maneje concurrencia (múltiples usuarios simultáneos)

### 4. **Rendimiento**

- El folio se obtiene DESPUÉS de guardar los datos
- Hay un pequeño delay adicional vs. otros modos
- Timeout configurado por defecto: 30 segundos

---

## 🆚 Comparación de Modos

| Característica | Local | API Externa | API Response |
|----------------|-------|-------------|--------------|
| **Folio visible antes de imprimir** | ✅ | ✅ | ❌ |
| **Requiere API adicional** | ❌ | ✅ | ❌ |
| **Folios centralizados** | ❌ | ✅ | ✅ |
| **Múltiples instalaciones** | ❌ | ✅ | ✅ |
| **Simplicidad** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| **Control del cliente** | ❌ | ✅ | ✅✅ |

---

## ❓ Casos de Uso

### ¿Cuándo usar API Response?

✅ **Úsalo si:**
- Tu sistema ya tiene una API que guarda formularios
- Tu API genera IDs únicos (auto-increment, UUID)
- Quieres que el cliente controle la generación de folios
- Tienes múltiples instalaciones del sistema
- Tu lógica de negocio requiere que el folio se genere al guardar

❌ **No lo uses si:**
- Necesitas que el usuario vea el folio ANTES de imprimir
- No tienes una API configurada
- Prefieres generación local simple

---

## 🐛 Troubleshooting

### Problema: "No se pudo extraer el folio de la respuesta"

**Causa:** El path configurado no coincide con la estructura JSON

**Solución:**
1. Revisar la respuesta exacta de tu API (usar Network tab)
2. Ajustar el path (ej: `data.folio` vs `folio`)
3. Verificar que el campo existe en la respuesta

### Problema: El folio no aparece en el documento impreso

**Causa:** El folio no se actualiza a tiempo antes de imprimir

**Solución:**
- El sistema ya tiene un delay de 500ms para api-response
- Verifica que tu API responda rápidamente (< 2 segundos)
- Revisa los logs de consola para ver el folio extraído

### Problema: "Debe habilitar la configuración de API"

**Causa:** Intentas usar API Response sin tener la API de guardado configurada

**Solución:**
1. Ve a la sección "Configuración de API" arriba
2. Habilita la API
3. Configura el endpoint, método y autenticación
4. Guarda la configuración

---

## 📊 Ejemplo Completo End-to-End

### 1. Configuración en el Sistema

```
✅ API Configurada:
   - Endpoint: https://api.miempresa.com/api/forms
   - Método: POST
   - Autenticación: Bearer Token

✅ Numeración Configurada:
   - Origen: API Response
   - Path del folio: data.folio
   - Campo: "Número de Orden"
```

### 2. Usuario Imprime

1. Usuario llena el formulario
2. Campo "Número de Orden" muestra: `(se generará al imprimir)`
3. Usuario hace clic en "Imprimir"
4. Sistema confirma la acción
5. Sistema envía los datos a tu API

### 3. Tu API Procesa

```javascript
// POST https://api.miempresa.com/api/forms
{
  "metadata": {
    "templateId": "abc123",
    "submittedBy": "user@empresa.com",
    "submittedAt": "2024-11-24T10:30:00Z"
  },
  "fields": {
    "cliente": "Juan Pérez",
    "producto": "Laptop"
  },
  "tables": {
    "items": [
      {"producto": "Laptop", "cantidad": 2}
    ]
  }
}
```

### 4. Tu API Responde

```json
{
  "success": true,
  "message": "Orden creada correctamente",
  "data": {
    "id": 456,
    "folio": "ORD-2024-00789",
    "timestamp": "2024-11-24T10:30:15Z"
  }
}
```

### 5. Sistema Completa

- Extrae el folio: `ORD-2024-00789`
- Actualiza el campo "Número de Orden"
- Imprime el documento con ese folio
- Muestra notificación: "✅ Folio: ORD-2024-00789 | API: Enviado"
- Resetea el campo a `(se generará al imprimir)`

---

## 🚀 Mejores Prácticas

1. **Usa paths descriptivos en tu API**
   - ✅ `data.folio` es claro
   - ❌ `x` no es descriptivo

2. **Incluye metadata útil**
   ```json
   {
     "folio": "ORD-123",
     "timestamp": "2024-11-24",
     "createdBy": "system"
   }
   ```

3. **Maneja errores apropiadamente**
   - Retorna HTTP 200 solo si todo está OK
   - Usa HTTP 400/500 para errores
   - Incluye mensajes de error descriptivos

4. **Documenta tu endpoint**
   - Comparte la estructura esperada con tus clientes
   - Incluye ejemplos de request/response

5. **Testea con datos reales**
   - Usa webhook.site para pruebas iniciales
   - Verifica que el path esté correcto

---

## 📞 Soporte

Para más información o dudas sobre la implementación de API Response, contacta al equipo de desarrollo.

---

**Última actualización:** 24 de Noviembre de 2024  
**Versión:** 1.0.0

