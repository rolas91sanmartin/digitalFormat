# Manual de Uso - FormatPrinter IA

## 📖 Guía Completa para Usuario Final

### Índice
1. [Instalación](#instalación)
2. [Primera Configuración](#primera-configuración)
3. [Crear tu Primer Formulario](#crear-tu-primer-formulario)
4. [Rellenar y Usar Formularios](#rellenar-y-usar-formularios)
5. [Imprimir Documentos](#imprimir-documentos)
6. [Gestión de Plantillas](#gestión-de-plantillas)
7. [Preguntas Frecuentes](#preguntas-frecuentes)

---

## Instalación

### Windows

1. Descarga el instalador `FormatPrinter-IA-Setup-1.0.0.exe`
2. Ejecuta el instalador
3. Sigue las instrucciones en pantalla
4. Una vez instalado, busca "FormatPrinter IA" en el menú de inicio

### Requisitos del Sistema
- Windows 10 o superior
- 4 GB de RAM mínimo
- 500 MB de espacio en disco
- Conexión a Internet (para el reconocimiento de documentos)

---

## Primera Configuración

### 1. Crear una Cuenta

Al abrir la aplicación por primera vez:

1. Haz clic en **"Regístrate aquí"**
2. Completa el formulario:
   - **Nombre de usuario**: Elige un nombre único
   - **Correo electrónico**: Tu email válido
   - **Contraseña**: Mínimo 6 caracteres
   - **Confirmar contraseña**: Repite la contraseña
3. Haz clic en **"Crear cuenta"**

### 2. Obtener API Key de OpenAI

Para que la aplicación pueda reconocer documentos, necesitas una API Key de OpenAI:

1. Ve a [https://platform.openai.com](https://platform.openai.com)
2. Crea una cuenta o inicia sesión
3. Ve a [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. Haz clic en **"Create new secret key"**
5. Copia la clave (empieza con `sk-...`)
6. **¡IMPORTANTE!** Guárdala en un lugar seguro, solo se muestra una vez

### 3. Configurar la API Key en la Aplicación

1. Una vez dentro de la aplicación, haz clic en **⚙️ Configuración**
2. Pega tu API Key en el campo **"OpenAI API Key"**
3. Haz clic en **"Guardar Configuración"**
4. Verás un mensaje de éxito

---

## Crear tu Primer Formulario

### Paso 1: Preparar tu Documento

Antes de subir tu documento, asegúrate de que:
- Es un PDF o imagen (JPG, PNG)
- La calidad es buena (mínimo 300 DPI recomendado)
- El texto es legible
- Los campos están claramente definidos

### Paso 2: Subir el Documento

1. En el **Dashboard**, haz clic en **"+ Nuevo Formulario"**
2. Haz clic en **"Seleccionar Documento"**
3. Navega y selecciona tu documento
4. Ingresa un nombre descriptivo para la plantilla
   - Ejemplo: "Formulario de Solicitud 2025"
5. Opcionalmente, agrega una descripción
6. Espera mientras la IA procesa el documento

### Paso 3: Análisis Automático

La IA analizará:
- ✅ Todos los campos de texto
- ✅ Casillas de verificación
- ✅ Campos numéricos
- ✅ Campos de fecha
- ✅ Posición exacta de cada campo
- ✅ Tamaño y estilo de fuente

Este proceso puede tomar entre 10-30 segundos dependiendo de la complejidad del documento.

### Paso 4: Verificar el Resultado

Una vez procesado, verás tu nueva plantilla en el Dashboard. ¡Listo para usar!

---

## Rellenar y Usar Formularios

### Abrir una Plantilla

1. En el Dashboard, busca la plantilla que deseas usar
2. Haz clic en **"Abrir"**

### Interfaz del Editor

El editor tiene dos secciones principales:

#### Panel Izquierdo: Campos del Formulario
- Lista de todos los campos detectados
- Rellena cada campo con la información necesaria
- Los campos marcados con **\*** son obligatorios

#### Panel Derecho: Vista Previa
- Muestra cómo se verá el documento final
- Actualización en tiempo real mientras escribes
- Los valores se superponen exactamente sobre el documento original

### Tipos de Campos

**Campos de Texto:**
- Nombre, dirección, comentarios, etc.
- Escribe directamente en el campo

**Campos Numéricos:**
- DNI, teléfono, código postal, etc.
- Solo acepta números

**Campos de Fecha:**
- Selecciona la fecha con el selector
- Formato automático

**Casillas de Verificación:**
- Haz clic para marcar/desmarcar
- Aparece como ☑ o ☐ en la vista previa

**Áreas de Texto:**
- Para comentarios largos
- Acepta múltiples líneas

---

## Imprimir Documentos

### Preparación para Imprimir

1. Verifica que todos los campos estén completos
2. Revisa la vista previa
3. Asegúrate de que tu impresora esté conectada y configurada

### Proceso de Impresión

1. Haz clic en **🖨️ Imprimir**
2. Se abrirá el diálogo de impresión de Windows
3. Configura las opciones:
   - **Impresora**: Selecciona tu impresora
   - **Copias**: Cantidad de copias a imprimir
   - **Orientación**: Vertical u horizontal
   - **Color**: Color o blanco y negro
4. Haz clic en **"Imprimir"**

### Consejos de Impresión

✅ **Usa papel de buena calidad** para mejores resultados
✅ **Imprime una prueba** antes de imprimir múltiples copias
✅ **Ajusta la configuración** de tu impresora según el tipo de documento
✅ **Verifica la alineación** si los campos no coinciden perfectamente

### Limpiar Campos

Si deseas vaciar todos los campos:
1. Haz clic en **🗑️ Limpiar**
2. Confirma la acción
3. Todos los campos se vaciarán

---

## Gestión de Plantillas

### Ver todas las Plantillas

En el Dashboard verás todas tus plantillas con:
- 📋 Icono de documento
- **Nombre** de la plantilla
- **Descripción** (si la agregaste)
- **Fecha de creación**

### Eliminar una Plantilla

1. En el Dashboard, busca la plantilla
2. Haz clic en **"Eliminar"**
3. Confirma la acción
4. **⚠️ Esta acción no se puede deshacer**

### Organizar Plantillas

Las plantillas se muestran en orden de creación (más recientes primero).

---

## Preguntas Frecuentes

### ¿Cuánto cuesta usar la aplicación?

La aplicación es **gratuita**, pero necesitas:
- Una API Key de OpenAI (de pago según uso)
- Cada análisis de documento cuesta aproximadamente $0.01 - $0.05 USD

### ¿Mis documentos se suben a algún servidor?

Los documentos se procesan localmente en tu computadora. Solo se envían a OpenAI para el análisis inicial. Una vez procesados, todo se guarda en tu base de datos local.

### ¿Puedo usar la aplicación sin Internet?

- **SÍ** para rellenar y usar plantillas ya creadas
- **NO** para crear nuevas plantillas (requiere OpenAI)

### ¿Qué tan preciso es el reconocimiento?

La precisión depende de:
- ✅ Calidad del documento (>90% con buena calidad)
- ✅ Claridad de los campos
- ⚠️ Complejidad del formato

Puedes ajustar manualmente si es necesario.

### ¿Puedo editar las posiciones de los campos?

En la versión actual, las posiciones se detectan automáticamente. En futuras versiones se agregará edición manual.

### ¿Cuántas plantillas puedo crear?

Ilimitadas. Solo está limitado por el espacio en disco.

### ¿Funciona con cualquier tipo de formulario?

Funciona mejor con:
- ✅ Formularios estándar con campos claros
- ✅ Documentos con buena calidad de imagen
- ✅ Texto legible

Puede tener dificultades con:
- ⚠️ Formularios muy complejos
- ⚠️ Imágenes de baja calidad
- ⚠️ Texto manuscrito

### ¿Mis datos están seguros?

- ✅ Contraseñas encriptadas con bcrypt
- ✅ Base de datos local en tu computadora
- ✅ API Key guardada localmente de forma segura
- ✅ Sin envío de datos a servidores externos (excepto OpenAI)

### ¿Puedo exportar mis plantillas?

En la versión actual no. Esta funcionalidad se agregará en futuras versiones.

---

## Soporte

Si tienes problemas o preguntas:

- **GitHub Issues**: [https://github.com/rolas91sanmartin/FormatPrinterIA/issues](https://github.com/rolas91sanmartin/FormatPrinterIA/issues)
- **Email**: Consulta el archivo README.md

---

## Actualizaciones

La aplicación verifica automáticamente actualizaciones al iniciar. Mantén tu aplicación actualizada para obtener:
- 🆕 Nuevas funcionalidades
- 🐛 Correcciones de errores
- 🚀 Mejoras de rendimiento

---

**¡Gracias por usar FormatPrinter IA!** 🎉

