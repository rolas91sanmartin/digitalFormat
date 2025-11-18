# 📡 Sistema de Integración con APIs y Numeración Automática

## 🎯 Resumen

Se ha implementado un sistema completo y agnóstico para integrar formularios con APIs externas y generar numeración automática (folios). El sistema es completamente configurable desde la interfaz de usuario, sin necesidad de modificar código.

---

## ✨ Características Implementadas

### 1. **Integración con APIs Externas**
- ✅ Configuración por formulario (cada formulario puede tener su propia API)
- ✅ Soporte para múltiples métodos HTTP: POST, PUT, PATCH
- ✅ Múltiples tipos de autenticación:
  - Sin autenticación
  - Bearer Token
  - API Key (con header personalizable)
  - Basic Authentication
- ✅ Mapeo flexible de campos formulario → API
- ✅ Transformaciones de datos (mayúsculas, minúsculas, trim)
- ✅ Validación de campos requeridos
- ✅ Manejo de errores con reintentos
- ✅ Timeout configurable
- ✅ Guardado local automático (con o sin API)

### 2. **Sistema de Numeración Automática**
- ✅ Tres tipos de numeración:
  - **Secuencial**: FORM-00001, FORM-00002...
  - **Basada en fecha**: FORM-20231112-00001
  - **Personalizada**: Con patrón custom
- ✅ Prefijo y sufijo configurables
- ✅ Padding ajustable (cantidad de ceros)
- ✅ Número inicial personalizable
- ✅ Asignación automática a campo específico
- ✅ Secuencia independiente por formulario

### 3. **Historial de Formularios**
- ✅ Almacenamiento local de todos los formularios enviados
- ✅ Registro de estado de API (pending, success, error)
- ✅ Guardado de respuestas de la API
- ✅ Registro de errores para debugging
- ✅ Opción de reintentar envíos fallidos

---

## 📊 Estructura de Datos

### Nueva Entidades Agregadas

```typescript
// Configuración de API (opcional por formulario)
interface ApiConfiguration {
  enabled: boolean;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>;
  authentication?: {
    type: 'none' | 'bearer' | 'apikey' | 'basic';
    token?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    username?: string;
    password?: string;
  };
  beforeSend?: { validateRequired: boolean };
  onSuccess?: { showMessage: boolean; message?: string; clearForm: boolean };
  onError?: { showMessage: boolean; message?: string; retryable: boolean };
  timeout?: number;
}

// Configuración de numeración (opcional por formulario)
interface NumerationConfig {
  enabled: boolean;
  type: 'sequential' | 'date-based' | 'custom';
  prefix?: string;
  suffix?: string;
  padding: number;
  fieldId: string;
  autoIncrement: boolean;
  startFrom?: number;
  customPattern?: string;
}

// Mapeo de campos
interface FieldMapping {
  fieldId: string;        // ID del campo en el formulario
  apiKey: string;         // Nombre del campo en la API
  transform?: {
    type: 'none' | 'uppercase' | 'lowercase' | 'trim';
  };
  required?: boolean;
  defaultValue?: any;
}

// Formulario enviado
interface SubmittedForm {
  id: string;
  templateId: string;
  submittedBy: string;
  formNumber: string;     // Folio generado
  fieldValues: Record<string, any>;
  apiResponse?: any;
  apiStatus?: 'pending' | 'success' | 'error';
  apiError?: string;
  submittedAt: Date;
}
```

### Tablas de Base de Datos

```sql
-- Secuencias de numeración
CREATE TABLE form_sequences (
  templateId TEXT PRIMARY KEY,
  lastNumber INTEGER NOT NULL DEFAULT 0,
  lastUsed TEXT NOT NULL,
  FOREIGN KEY (templateId) REFERENCES form_templates(id)
);

-- Formularios enviados
CREATE TABLE submitted_forms (
  id TEXT PRIMARY KEY,
  templateId TEXT NOT NULL,
  submittedBy TEXT NOT NULL,
  formNumber TEXT,
  fieldValues TEXT NOT NULL,
  apiResponse TEXT,
  apiStatus TEXT CHECK(apiStatus IN ('pending', 'success', 'error')),
  apiError TEXT,
  submittedAt TEXT NOT NULL,
  FOREIGN KEY (templateId) REFERENCES form_templates(id),
  FOREIGN KEY (submittedBy) REFERENCES users(id)
);

-- Columnas agregadas a form_templates
ALTER TABLE form_templates ADD COLUMN apiConfiguration TEXT;
ALTER TABLE form_templates ADD COLUMN numerationConfig TEXT;
ALTER TABLE form_templates ADD COLUMN fieldMappings TEXT;
```

---

## 🚀 Cómo Usar

### Paso 1: Configurar API y Numeración

1. **Crear o editar un formulario**
2. **Ir a configuración**: Click en botón "Configurar API"
3. **Habilitar integración con API**:
   - Marcar "Enviar datos a API externa"
   - Ingresar URL del endpoint
   - Seleccionar método HTTP (POST/PUT/PATCH)
   - Configurar autenticación si es necesaria
   - Mapear campos del formulario a nombres de la API

4. **Habilitar numeración automática**:
   - Marcar "Generar número de folio automático"
   - Seleccionar tipo (Secuencial o Basado en fecha)
   - Configurar prefijo/sufijo
   - Definir cantidad de ceros
   - Seleccionar campo donde aparecerá el número

5. **Guardar configuración**

### Paso 2: Enviar Formulario

```typescript
// Desde el FormEditor o cualquier componente
const handleSubmit = async () => {
  const result = await window.electronAPI.submitForm(
    templateId,
    userId,
    formValues  // { fieldId: valor, ... }
  );

  if (result.success) {
    console.log('Número de folio:', result.formNumber);
    console.log('Respuesta API:', result.apiResponse);
  } else {
    console.error('Error:', result.error);
  }
};
```

### Paso 3: Ver Historial

```typescript
// Obtener formularios enviados por usuario
const forms = await window.electronAPI.getSubmittedForms(userId);

// Obtener formularios de un template específico
const forms = await window.electronAPI.getSubmittedFormsByTemplate(templateId);

// Reintentar envío fallido
const result = await window.electronAPI.retryFormSubmission(submittedFormId);
```

---

## 🔌 Ejemplos de Configuración

### Ejemplo 1: API REST Simple (POST)

```json
{
  "endpoint": "https://api.tuservicio.com/formularios",
  "method": "POST",
  "authentication": {
    "type": "bearer",
    "token": "tu-token-aqui"
  }
}
```

**Mapeo de campos:**
- `nombre_completo` (formulario) → `fullName` (API)
- `email` (formulario) → `email` (API)
- `telefono` (formulario) → `phone` (API)

### Ejemplo 2: API con API Key

```json
{
  "endpoint": "https://api.ejemplo.com/v1/datos",
  "method": "POST",
  "authentication": {
    "type": "apikey",
    "apiKeyHeader": "X-API-Key",
    "apiKey": "abc123xyz789"
  }
}
```

### Ejemplo 3: Numeración Secuencial

```json
{
  "type": "sequential",
  "prefix": "INV-",
  "suffix": "-2024",
  "padding": 5,
  "startFrom": 1
}
```

**Resultado**: `INV-00001-2024`, `INV-00002-2024`, `INV-00003-2024`...

### Ejemplo 4: Numeración por Fecha

```json
{
  "type": "date-based",
  "prefix": "FORM-",
  "padding": 4,
  "startFrom": 1
}
```

**Resultado**: `FORM-20231112-0001`, `FORM-20231112-0002`...

---

## 📝 Casos de Uso Creados

### 1. **SubmitFormData** (`src/application/use-cases/forms/SubmitFormData.ts`)

Caso de uso principal para enviar formularios:
- Genera número de folio
- Valida campos requeridos
- Mapea campos según configuración
- Envía a API externa
- Guarda en base de datos local
- Maneja errores y reintentos

### 2. **RetryFormSubmission** (`src/application/use-cases/forms/RetryFormSubmission.ts`)

Reintenta envíos fallidos:
- Recupera formulario guardado
- Reenvía a API
- Actualiza estado

---

## 🗂️ Repositorios Creados

### 1. **SQLiteFormSequenceRepository**
Maneja secuencias de numeración:
- `findByTemplateId(templateId)`
- `create(sequence)`
- `update(templateId, lastNumber)`
- `delete(templateId)`

### 2. **SQLiteSubmittedFormRepository**
Maneja formularios enviados:
- `create(data)`
- `findById(id)`
- `findByTemplateId(templateId)`
- `findByUserId(userId)`
- `update(id, data)`
- `delete(id)`

---

## 🎨 Interfaz de Usuario

### Página: FormApiConfig (`/api-config/:id`)

Permite configurar:
1. **Integración con API**
   - Habilitar/deshabilitar
   - URL del endpoint
   - Método HTTP
   - Autenticación (4 tipos)
   - Mapeo de campos
   
2. **Numeración Automática**
   - Habilitar/deshabilitar
   - Tipo de numeración
   - Prefijo y sufijo
   - Padding
   - Número inicial
   - Campo destino
   - Vista previa en tiempo real

---

## 🔒 Seguridad

- ✅ Validación de campos requeridos
- ✅ Timeout para evitar bloqueos
- ✅ Manejo seguro de credenciales (almacenadas en DB local cifrada)
- ✅ Headers de autenticación correctos
- ✅ Validación de respuestas HTTP
- ✅ Manejo de errores completo

---

## 📈 Flujo Completo

```
1. Usuario completa formulario
   ↓
2. Click en "Enviar"
   ↓
3. Sistema genera número de folio (si está habilitado)
   ↓
4. Valida campos requeridos
   ↓
5. Mapea campos según configuración
   ↓
6. Guarda en base de datos local
   ↓
7. Envía a API (si está configurada)
   ↓
8. Actualiza estado (success/error)
   ↓
9. Muestra mensaje al usuario
```

---

## 🛠️ Funciones IPC Agregadas

```typescript
// Enviar formulario
window.electronAPI.submitForm(templateId, userId, values)

// Obtener formularios enviados por usuario
window.electronAPI.getSubmittedForms(userId)

// Obtener formularios de un template
window.electronAPI.getSubmittedFormsByTemplate(templateId)

// Reintentar envío fallido
window.electronAPI.retryFormSubmission(submittedFormId)
```

---

## 📊 Base de Datos

Ubicación: `C:\Users\{usuario}\AppData\Roaming\format-printer-ia\formatprinter.db`

Puedes inspeccionar con [DB Browser for SQLite](https://sqlitebrowser.org/)

---

## 🎯 Próximos Pasos (Opcionales)

1. **Página de Historial**: Ver todos los formularios enviados con filtros
2. **Dashboard de Estadísticas**: Gráficos de formularios enviados
3. **Export a CSV/Excel**: Exportar historial
4. **Webhooks**: Notificaciones automáticas
5. **Programación de Envíos**: Enviar en horarios específicos
6. **Sincronización**: Reintentar automáticamente envíos fallidos

---

## ✅ Testing

### Probar sin API (solo numeración)

1. Crear formulario
2. Configurar solo numeración
3. Completar y enviar
4. Verificar que se genere el folio correctamente

### Probar con API Mock

Puedes usar servicios como:
- **RequestBin**: https://requestbin.com/
- **Webhook.site**: https://webhook.site/
- **Mockoon**: Servidor mock local

Ejemplo con Webhook.site:
1. Ir a https://webhook.site/
2. Copiar la URL única que te dan
3. Configurarla en tu formulario
4. Enviar datos
5. Ver la solicitud recibida en webhook.site

---

## 🐛 Troubleshooting

### Error: "No se pudo conectar a la API"
- Verificar URL del endpoint
- Verificar conexión a internet
- Verificar autenticación
- Ver logs en la consola del navegador (F12)

### Error: "Código duplicado de numeración"
- La secuencia se mantiene por template
- Si borras la base de datos, la numeración reinicia
- Para resetear: Eliminar registro en tabla `form_sequences`

### Los campos no se mapean correctamente
- Verificar que los nombres en "apiKey" coincidan con la API
- Revisar respuesta de la API en `submitted_forms.apiResponse`

---

## 📞 Soporte

- **Logs de aplicación**: `C:\Users\{usuario}\AppData\Roaming\format-printer-ia\app.log`
- **Base de datos**: `C:\Users\{usuario}\AppData\Roaming\format-printer-ia\formatprinter.db`
- **Consola del navegador**: F12 en la aplicación

---

**✨ Sistema completamente implementado y listo para usar ✨**

