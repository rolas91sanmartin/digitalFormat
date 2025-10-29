# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.0.0] - 2025-10-28

### Agregado
- ✨ Reconocimiento inteligente de documentos con OpenAI GPT-4 Vision
- ✨ Detección automática de campos y sus posiciones exactas
- ✨ Soporte para documentos PDF e imágenes (JPG, PNG)
- ✨ Sistema de autenticación con registro y login
- ✨ Base de datos SQLite local para almacenar plantillas
- ✨ Dashboard para visualizar todas las plantillas guardadas
- ✨ Editor de formularios con vista previa en tiempo real
- ✨ Funcionalidad de impresión directa
- ✨ Configuración de API Key de OpenAI desde la aplicación
- ✨ Soporte para múltiples tipos de campos:
  - Campos de texto
  - Campos numéricos
  - Campos de fecha
  - Casillas de verificación
  - Áreas de texto
- ✨ Interfaz moderna con gradientes y animaciones
- ✨ Seguridad: Contraseñas hasheadas con bcrypt
- ✨ Clean Architecture con separación de capas
- ✨ TypeScript en todo el proyecto
- ✨ React para la interfaz de usuario
- ✨ Electron para aplicación de escritorio

### Características Técnicas
- 🏗️ Arquitectura limpia (Clean Architecture)
- 🔒 Context Isolation en Electron
- 💾 SQLite con better-sqlite3
- 🎨 CSS moderno con variables y gradientes
- 📱 Diseño responsivo
- 🔐 Encriptación de contraseñas
- 🌐 IPC seguro entre main y renderer

### Documentación
- 📖 README completo con instrucciones
- 📚 Manual de uso para usuario final
- 🤝 Guía de contribución
- 📄 Licencia MIT
- 📝 Este CHANGELOG

---

## [Unreleased]

### Por Agregar
- [ ] Editor manual de posiciones de campos
- [ ] Exportar/Importar plantillas
- [ ] Soporte para más formatos (Word, Excel)
- [ ] Tema oscuro (dark mode)
- [ ] Múltiples idiomas
- [ ] Tests automatizados
- [ ] Histórico de impresiones
- [ ] Shortcuts de teclado
- [ ] Auto-actualización
- [ ] Backup automático
- [ ] Estadísticas de uso

### Por Mejorar
- [ ] Optimización del reconocimiento de documentos
- [ ] Mejor manejo de errores
- [ ] Caché de documentos procesados
- [ ] Mejoras de rendimiento en vista previa
- [ ] Soporte para documentos multipágina

### Por Corregir
- [ ] Pendiente según reportes de usuarios

---

## Formato

### [Versión] - YYYY-MM-DD

#### Agregado
- Para nuevas funcionalidades

#### Cambiado
- Para cambios en funcionalidad existente

#### Obsoleto
- Para funcionalidades que pronto se eliminarán

#### Eliminado
- Para funcionalidades eliminadas

#### Corregido
- Para correcciones de bugs

#### Seguridad
- Para vulnerabilidades

---

[1.0.0]: https://github.com/rolas91sanmartin/FormatPrinterIA/releases/tag/v1.0.0
[Unreleased]: https://github.com/rolas91sanmartin/FormatPrinterIA/compare/v1.0.0...HEAD

