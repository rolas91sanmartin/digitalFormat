# FormatPrinter IA 🖨️

Una aplicación de escritorio desarrollada con Electron que utiliza Inteligencia Artificial (OpenAI GPT-4 Vision) para reconocer campos en documentos (PDF o imágenes) y recrearlos como formularios editables que se pueden rellenar e imprimir múltiples veces.

## 🚀 Características

- **Reconocimiento Inteligente de Documentos**: Usa GPT-4 Vision para analizar documentos y detectar campos automáticamente
- **Detección Precisa de Posiciones**: La IA identifica la ubicación exacta de cada campo para una superposición perfecta
- **Formularios Reutilizables**: Guarda plantillas de formularios en SQLite para uso futuro
- **Edición Visual**: Interfaz intuitiva con vista previa en tiempo real
- **Impresión Directa**: Imprime formularios completos usando tu impresora por defecto
- **Clean Architecture**: Código bien estructurado siguiendo principios SOLID y separación de responsabilidades

## 🏗️ Arquitectura

El proyecto sigue los principios de **Clean Architecture** con separación clara de responsabilidades:

```
src/
├── domain/              # Capa de Dominio
│   ├── entities/        # Entidades del negocio
│   ├── repositories/    # Interfaces de repositorios
│   └── services/        # Interfaces de servicios
├── application/         # Capa de Aplicación
│   └── use-cases/       # Casos de uso del negocio
├── infrastructure/      # Capa de Infraestructura
│   ├── database/        # Conexión y configuración de BD
│   ├── repositories/    # Implementaciones de repositorios
│   └── services/        # Implementaciones de servicios
├── main/                # Proceso principal de Electron
│   └── ipc/             # Manejadores IPC
└── renderer/            # Proceso de renderizado (React)
    └── src/
        ├── components/  # Componentes reutilizables
        ├── contexts/    # Contextos de React
        ├── pages/       # Páginas de la aplicación
        └── styles/      # Estilos globales
```

## 📋 Requisitos Previos

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **API Key de OpenAI** con acceso a GPT-4 Vision

## 🔧 Instalación

1. **Clona el repositorio**:
```bash
git clone https://github.com/rolas91sanmartin/FormatPrinterIA.git
cd FormatPrinterIA
```

2. **Instala las dependencias**:
```bash
npm install
```

## ▶️ Ejecución

### Modo Desarrollo

1. **Inicia el servidor de desarrollo**:
```bash
npm run dev:renderer
```

2. **En otra terminal, inicia Electron**:
```bash
npm run dev:main
```

O usa el comando combinado:
```bash
npm run dev
```

### Compilación para Producción

```bash
npm run build
```

### Empaquetar la Aplicación

```bash
npm run package
```

Esto generará un instalador para Windows en la carpeta `release/`.

## 📖 Guía de Uso

### 1. Configuración Inicial

1. Abre la aplicación
2. Regístrate con tu usuario y contraseña
3. Ve a **Configuración** (⚙️) en el Dashboard
4. Ingresa tu **API Key de OpenAI**
5. Guarda la configuración

### 2. Crear un Formulario

1. En el Dashboard, haz clic en **+ Nuevo Formulario**
2. Selecciona un documento (PDF o imagen JPG/PNG)
3. Espera mientras la IA analiza el documento
4. La aplicación creará automáticamente una plantilla con todos los campos detectados

### 3. Rellenar y Usar un Formulario

1. Haz clic en **Abrir** en cualquier plantilla guardada
2. Rellena los campos en el panel lateral
3. Observa la vista previa en tiempo real
4. Haz clic en **🖨️ Imprimir** cuando estés listo

### 4. Características Adicionales

- **Limpiar**: Borra todos los campos del formulario
- **Eliminar**: Elimina una plantilla permanentemente
- **Vista Previa**: Visualización exacta de cómo se verá el documento impreso

## 🛠️ Tecnologías Utilizadas

### Backend
- **Electron**: Framework para aplicaciones de escritorio
- **TypeScript**: Lenguaje tipado
- **SQLite (better-sqlite3)**: Base de datos local
- **OpenAI API**: Reconocimiento de documentos con IA
- **bcrypt**: Encriptación de contraseñas

### Frontend
- **React**: Librería de UI
- **React Router**: Navegación
- **CSS3**: Estilos modernos y responsivos

### Arquitectura
- **Clean Architecture**: Separación de capas
- **SOLID Principles**: Principios de diseño
- **Dependency Injection**: Inversión de dependencias

## 🔒 Seguridad

- Las contraseñas se almacenan hasheadas con bcrypt
- La API Key se guarda localmente de forma segura
- Context Isolation habilitado en Electron
- No se envían datos a servidores externos (excepto OpenAI para análisis)

## 📝 Estructura de Base de Datos

### Tabla `users`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

### Tabla `form_templates`
```sql
CREATE TABLE form_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  userId TEXT NOT NULL,
  backgroundImage TEXT NOT NULL,
  fields TEXT NOT NULL,
  pageWidth INTEGER NOT NULL,
  pageHeight INTEGER NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

## 🎨 Capturas de Pantalla

### Pantalla de Login
Diseño moderno y limpio con gradientes

### Dashboard
Vista de todas tus plantillas de formularios

### Editor de Formularios
Rellena campos con vista previa en tiempo real

### Configuración
Gestiona tu API Key de OpenAI

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**rolas91sanmartin**

## 🙏 Agradecimientos

- OpenAI por su increíble API
- La comunidad de Electron
- Todos los contribuidores de código abierto

---

**¡Disfruta usando FormatPrinter IA!** 🎉

Si encuentras algún problema o tienes sugerencias, no dudes en abrir un issue en GitHub.

