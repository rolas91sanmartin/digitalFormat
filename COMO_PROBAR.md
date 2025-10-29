# 🧪 Cómo Probar el Editor Visual - Guía Paso a Paso

## 📋 Prerequisitos

Antes de comenzar, asegúrate de tener:

1. ✅ Node.js instalado (v18 o superior)
2. ✅ Dependencias instaladas: `npm install`
3. ✅ API Key de OpenAI configurada
4. ✅ Una imagen de un formulario para probar (JPG, PNG, etc.)

---

## 🚀 Paso 1: Iniciar la Aplicación

### Opción A: Modo Desarrollo (Recomendado para pruebas)

```bash
npm run dev
```

Esto iniciará:
- ✅ Proceso principal de Electron
- ✅ Servidor de desarrollo de Vite (React)
- ✅ Hot reload automático

### Opción B: Modo Producción

```bash
npm run build
npm start
```

---

## 🔐 Paso 2: Registro e Inicio de Sesión

1. Al abrir la aplicación, verás la pantalla de **Login**
2. Si es tu primera vez, haz clic en **"Registrarse"**
3. Ingresa:
   - Email
   - Contraseña
   - Confirmar contraseña
4. Haz clic en **"Crear cuenta"**
5. Serás redirigido automáticamente al **Dashboard**

---

## 📄 Paso 3: Crear tu Primer Formulario

### 3.1 Preparar una Imagen de Prueba

**Importante**: Necesitas una imagen (no PDF por ahora) de un formulario. Puedes usar:

- ✅ Una foto de un formulario en papel
- ✅ Captura de pantalla de un PDF de formulario
- ✅ Plantilla descargada de internet
- ✅ Formulario escaneado

**Ejemplo de documentos para probar**:
- Formularios de solicitud
- Facturas
- Órdenes de compra
- Certificados
- Planillas de datos

### 3.2 Subir el Documento

1. En el **Dashboard**, haz clic en **"+ Subir Documento"**
2. Se abrirá un modal
3. **Ingresa el nombre** del formulario (Ej: "Formulario de Solicitud 2025")
4. **Opcional**: Agrega una descripción
5. Haz clic en **"Seleccionar Documento"**
6. Selecciona tu imagen (JPG, PNG, GIF, WebP)
7. Haz clic en **"Crear Formulario"**

### 3.3 Esperar el Análisis de la IA

La aplicación mostrará un mensaje de progreso:
- 🔍 "Analizando documento con IA..."
- ⏳ Esto puede tomar 10-30 segundos dependiendo del tamaño

**¿Qué está haciendo la IA?**
- Detectando textos y títulos
- Identificando campos editables
- Reconociendo tablas
- Extrayendo estilos (fuentes, colores, tamaños)
- Calculando posiciones exactas

### 3.4 Resultado

Una vez completado:
- ✅ Verás el formulario en la lista del Dashboard
- ✅ Mostrará el nombre, descripción y fecha de creación

---

## 🎨 Paso 4: Abrir el Editor Visual

1. Localiza tu formulario en el **Dashboard**
2. Haz clic en el botón **"🎨 Editar"**
3. Se abrirá el **Editor Visual** con:
   - 📋 Vista previa del formulario
   - 🛠️ Barra de herramientas superior
   - 🎨 Panel de propiedades (si lo activas)

---

## ✏️ Paso 5: Editar Elementos

### 5.1 Seleccionar un Elemento

**Haz clic en cualquier elemento del formulario**:
- **Texto estático**: Se marcará con outline morado 💜
- **Campo editable**: Se marcará con outline verde 💚
- **Tabla**: Se marcará con outline naranja 🧡

### 5.2 Editar Propiedades

Cuando seleccionas un elemento:
1. Se abre automáticamente el **Panel de Propiedades** a la derecha
2. Verás todas las propiedades editables organizadas en secciones

#### Ejemplo: Editar un Texto Estático

1. Haz clic en un título o etiqueta
2. En el panel, puedes modificar:
   - **Contenido**: El texto que se muestra
   - **Posición**: X, Y, ancho, alto (en píxeles)
   - **Fuente**: Arial, Times New Roman, etc.
   - **Tamaño**: 8px - 72px
   - **Color**: Selector de color
   - **Fondo**: Color de fondo
   - **Bordes**: Ancho, estilo, color
   - **Alineación**: Izquierda, centro, derecha
3. Haz clic en **"Aplicar Cambios"**
4. Los cambios se reflejan **inmediatamente** en la vista previa

#### Ejemplo: Editar un Campo

1. Haz clic en un campo editable (input)
2. Puedes modificar:
   - **Nombre**: Identificador del campo
   - **Tipo**: text, number, date, checkbox, textarea
   - **Placeholder**: Texto de ayuda
   - **Requerido**: Sí/No
   - **Estilos**: Igual que elementos estáticos
3. Aplica los cambios

#### Ejemplo: Editar una Tabla

1. Haz clic en la tabla
2. Puedes modificar:
   - **Columnas**: En formato JSON (ver ejemplo en el panel)
   - **Filas mínimas/máximas**: Control de cantidad
   - **Altura de fila**: En píxeles
   - **Estilos del encabezado**: Colores, fuente
   - **Bordes**: Personalización completa
3. Aplica los cambios

---

## 👁️ Paso 6: Toggle de Vista

En la barra superior, encontrarás un **Toggle Switch**:

- **Activado (azul)**: Muestra la imagen de fondo del documento original
  - Útil para: Verificar alineación, comparar con el original
  
- **Desactivado (gris)**: Muestra solo la recreación HTML/CSS
  - Útil para: Ver cómo se verá el formulario impreso, verificar estilos

**Prueba alternando entre ambas vistas** para verificar que la recreación es precisa.

---

## 💾 Paso 7: Guardar Cambios

1. Después de hacer tus ediciones, haz clic en **"💾 Guardar"**
2. Los cambios se guardan en la base de datos SQLite
3. Verás una confirmación: **"✅ Cambios guardados correctamente"**

**Nota**: Puedes cerrar y reabrir el editor, tus cambios estarán guardados.

---

## 🖨️ Paso 8: Imprimir el Formulario

### 8.1 Rellenar el Formulario (Opcional)

Antes de imprimir, puedes:
1. **Rellenar los campos** directamente en el editor
2. **Escribir en inputs**: Nombre, fecha, etc.
3. **Marcar checkboxes**
4. **Llenar tablas**: Datos en cada celda

### 8.2 Imprimir

1. Haz clic en **"🖨️ Imprimir"**
2. Se abrirá el **diálogo de impresión del sistema**
3. Selecciona:
   - Impresora (por defecto o específica)
   - Orientación (vertical/horizontal)
   - Márgenes
   - Número de copias
4. Haz clic en **"Imprimir"**

**El formulario se imprimirá exactamente como se ve en pantalla, con todos los estilos aplicados.**

---

## 🧪 Casos de Prueba Sugeridos

### Test 1: Formulario Simple
**Objetivo**: Verificar detección básica de campos

1. Usa una imagen con:
   - Un título
   - 3-5 campos de texto
   - Algunas etiquetas
2. Verifica que la IA detecte:
   - ✅ El título como elemento estático
   - ✅ Los campos como editables
   - ✅ Las etiquetas junto a cada campo

### Test 2: Formulario con Tabla
**Objetivo**: Verificar detección de tablas

1. Usa una imagen con:
   - Una tabla con encabezados
   - Varias columnas (3-5)
   - Múltiples filas
2. Verifica que la IA detecte:
   - ✅ Los encabezados de columna
   - ✅ El número de columnas correcto
   - ✅ Los anchos aproximados de columna

### Test 3: Formulario Complejo
**Objetivo**: Verificar detección avanzada

1. Usa una imagen con:
   - Múltiples secciones
   - Checkboxes
   - Líneas divisorias
   - Logos o imágenes
   - Diferentes tamaños de fuente
2. Verifica que la IA:
   - ✅ Detecte todos los tipos de elementos
   - ✅ Mantenga el layout general
   - ✅ Extraiga estilos aproximados

### Test 4: Edición de Propiedades
**Objetivo**: Verificar funcionalidad del panel

1. Selecciona varios elementos
2. Modifica sus propiedades:
   - Cambia colores
   - Ajusta tamaños
   - Mueve posiciones
   - Cambia tipos de campo
3. Verifica:
   - ✅ Los cambios se reflejan inmediatamente
   - ✅ Guardar persiste los cambios
   - ✅ Recargar mantiene las ediciones

### Test 5: Impresión
**Objetivo**: Verificar calidad de impresión

1. Rellena un formulario completamente
2. Imprime a PDF (o impresora física)
3. Verifica:
   - ✅ Todo el contenido se imprime
   - ✅ Los estilos se mantienen
   - ✅ La alineación es correcta
   - ✅ No hay elementos cortados

---

## 🐛 Problemas Comunes y Soluciones

### Error: "No se recibió respuesta de OpenAI"
**Causa**: API Key inválida o sin créditos  
**Solución**: 
1. Verifica tu API Key en Settings
2. Asegúrate de tener créditos en tu cuenta OpenAI

### Error: "Error al analizar el documento"
**Causa**: Imagen demasiado grande o formato no soportado  
**Solución**:
1. Redimensiona la imagen a menos de 5MB
2. Asegúrate de usar JPG, PNG, GIF o WebP

### La IA no detectó todos los campos
**Causa**: Documento con layout muy complejo o poco contraste  
**Solución**:
1. Usa una imagen de mejor calidad
2. Asegúrate de que los campos sean visibles
3. Edita manualmente los campos faltantes en el panel de propiedades

### Los estilos no coinciden exactamente
**Causa**: La IA hace aproximaciones  
**Solución**:
1. Usa el **Panel de Propiedades** para ajustar:
   - Tamaños de fuente
   - Colores
   - Posiciones
2. Compara con la vista de fondo activada

### No se guardan los cambios
**Causa**: Error en la base de datos  
**Solución**:
1. Verifica los permisos de escritura en la carpeta de la app
2. Revisa la consola de Electron (Ver > Toggle Developer Tools)

---

## 📊 Verificar que Todo Funciona

Checklist de funcionalidades:

- [ ] ✅ Puedo registrarme e iniciar sesión
- [ ] ✅ Puedo subir una imagen de formulario
- [ ] ✅ La IA analiza y detecta elementos
- [ ] ✅ Veo el formulario en el Dashboard
- [ ] ✅ Puedo abrir el Editor Visual
- [ ] ✅ Puedo seleccionar elementos (estáticos, campos, tablas)
- [ ] ✅ El Panel de Propiedades se abre al seleccionar
- [ ] ✅ Puedo editar propiedades y aplicar cambios
- [ ] ✅ El toggle de vista funciona
- [ ] ✅ Puedo guardar cambios
- [ ] ✅ Puedo rellenar campos
- [ ] ✅ Puedo imprimir el formulario

---

## 🎓 Tips para Mejores Resultados

1. **Usa imágenes de alta calidad**: Mejor resolución = mejor detección
2. **Formularios con buen contraste**: Textos negros sobre fondo blanco funcionan mejor
3. **Layout claro**: Formularios con secciones bien definidas se reconocen mejor
4. **Prueba primero con formularios simples**: Aprende cómo funciona antes de intentar documentos complejos
5. **Ajusta manualmente**: La IA es inteligente pero no perfecta, usa el editor para pulir detalles

---

## 🎉 ¡Listo para Probar!

Ahora tienes todo lo necesario para probar el **Editor Visual de FormatPrinter IA**.

**Disfruta recreando y editando formularios con IA! 🚀**

---

## 📞 Soporte

Si encuentras algún problema:
1. Revisa este documento
2. Verifica la consola de desarrollo (Ctrl+Shift+I / Cmd+Option+I)
3. Consulta `IMPLEMENTACION_COMPLETADA.md` para detalles técnicos

