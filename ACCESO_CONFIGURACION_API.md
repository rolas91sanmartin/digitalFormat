# 🎯 Acceso a la Configuración de API y Numeración

## ✅ Botones Agregados en Dos Lugares

He agregado el botón **"⚙️ API/Numeración"** en dos ubicaciones para facilitar el acceso:

---

## 📍 1. Dashboard (Lista de Formularios)

### Ubicación:
**Dashboard → Tarjetas de Formularios → Botón "⚙️ API/Numeración"**

### Cómo Acceder:
1. Inicia sesión en la aplicación
2. Verás la lista de tus formularios en el Dashboard
3. En cada tarjeta de formulario, ahora hay **4 botones**:
   - **"Abrir"** - Abre el editor visual
   - **"⚙️ API/Numeración"** (NUEVO) - Configurar API y numeración
   - **"📤 Exportar"** - Exportar configuración
   - **"Eliminar"** - Eliminar formulario

### Aspecto Visual:
```
┌─────────────────────────────────┐
│  📋 Nombre del Formulario       │
│  Descripción...                 │
│  Creado: 12/11/2023            │
│                                 │
│  [Abrir] [⚙️ API/Numeración]  │
│  [📤 Exportar] [Eliminar]      │
└─────────────────────────────────┘
```

---

## 📍 2. Editor Visual (Barra de Herramientas)

### Ubicación:
**Editor Visual → Barra Superior Derecha → Botón "⚙️ API/Numeración"**

### Cómo Acceder:
1. Abre cualquier formulario (botón "Abrir" del Dashboard)
2. En la barra de herramientas superior derecha, verás **3 botones**:
   - **"⚙️ API/Numeración"** (NUEVO) - Configurar API y numeración
   - **"💾 Guardar"** - Guardar cambios del editor
   - **"🖨️ Imprimir"** - Imprimir formulario

### Aspecto Visual:
```
┌─────────────────────────────────────────────────────────┐
│ [← Volver] Nombre del Formulario                       │
│                                                          │
│  [⚙️ API/Numeración] [💾 Guardar] [🖨️ Imprimir]      │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Estilo del Botón

El botón **"⚙️ API/Numeración"** tiene:
- **Color:** Azul (#2196F3)
- **Icono:** ⚙️ (engranaje)
- **Tooltip:** "Configurar API y numeración automática"

---

## 🔄 Flujo de Uso Completo

### Opción 1: Desde el Dashboard

```
Dashboard
    ↓
Ver lista de formularios
    ↓
Click en "⚙️ API/Numeración"
    ↓
Página de Configuración
    ↓
Configurar y Guardar
    ↓
Vuelve al Editor (automático)
```

### Opción 2: Desde el Editor Visual

```
Dashboard
    ↓
Click en "Abrir" en un formulario
    ↓
Editor Visual
    ↓
Click en "⚙️ API/Numeración" (barra superior)
    ↓
Página de Configuración
    ↓
Configurar y Guardar
    ↓
Vuelve al Editor (automático)
```

---

## 📋 ¿Qué Puedes Configurar?

Cuando hagas click en el botón, accederás a una página donde puedes configurar:

### 1. **Integración con API** ✅
- Habilitar/deshabilitar envío a API
- URL del endpoint
- Método HTTP (POST, PUT, PATCH)
- Autenticación:
  - Sin autenticación
  - Bearer Token
  - API Key personalizable
  - Basic Auth (usuario/contraseña)
- Mapeo de campos formulario → API
- Marcar campos como requeridos

### 2. **Numeración Automática** 🔢
- Habilitar/deshabilitar generación de folios
- Tipo de numeración:
  - Secuencial (00001, 00002...)
  - Basada en fecha (20231112-001...)
- Prefijo (ej: "FORM-", "INV-")
- Sufijo (ej: "-2024")
- Cantidad de ceros (padding)
- Número inicial
- Campo donde aparecerá el número
- **Vista previa en tiempo real** 👁️

---

## 🎯 Ejemplo de Uso

### Caso: Configurar Formulario de Facturas

1. **Abrir formulario** "Factura de Venta"
2. **Click** en "⚙️ API/Numeración"
3. **Configurar Numeración:**
   - ✅ Habilitar numeración
   - Tipo: Secuencial
   - Prefijo: "FACT-"
   - Sufijo: "-2024"
   - Padding: 5
   - Campo: "numero_factura"
   - Vista previa: **FACT-00001-2024**

4. **Configurar API:**
   - ✅ Habilitar API
   - URL: `https://contabilidad.com/api/facturas`
   - Método: POST
   - Auth: Bearer Token
   - Token: `tu-token-aqui`

5. **Mapear Campos:**
   ```
   cliente          → customer_name
   total            → total_amount
   fecha            → invoice_date
   numero_factura   → invoice_number
   ```

6. **Guardar** ✅

7. Ahora cada vez que alguien complete y envíe este formulario:
   - ✅ Se genera automáticamente: FACT-00001-2024
   - ✅ Se guarda localmente
   - ✅ Se envía a la API de contabilidad

---

## 📂 Archivos Modificados

### Frontend:
- `src/renderer/src/pages/Dashboard.tsx` ✏️ (Agregado botón)
- `src/renderer/src/pages/FormEditorVisual.tsx` ✏️ (Agregado botón)

### Página de Configuración:
- `src/renderer/src/pages/FormApiConfig.tsx` ✨ (Ya existía, creada anteriormente)

### Ruta:
- `src/renderer/src/App.tsx` ✏️ (Ruta `/api-config/:id` ya existía)

---

## ✅ Estado Actual

- ✅ Botón agregado en Dashboard
- ✅ Botón agregado en Editor Visual
- ✅ Ambos botones navegan a `/api-config/:id`
- ✅ Página de configuración completamente funcional
- ✅ Sistema backend implementado
- ✅ Compilación exitosa
- ✅ **Aplicación ejecutándose** 🚀

---

## 🎉 ¡Listo para Usar!

Abre la aplicación y verás los nuevos botones azules **"⚙️ API/Numeración"** en:
1. ✅ Cada tarjeta de formulario en el Dashboard
2. ✅ La barra de herramientas del Editor Visual

---

**Documentación Completa:** Lee `SISTEMA_API_NUMERACION.md` para más detalles sobre cómo configurar APIs y numeración.

