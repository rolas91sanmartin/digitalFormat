# Guía de Contribución

¡Gracias por tu interés en contribuir a FormatPrinter IA! Este documento te guiará a través del proceso de contribución.

## 🚀 Cómo Contribuir

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub, luego clona tu fork
git clone https://github.com/TU_USUARIO/FormatPrinterIA.git
cd FormatPrinterIA

# Agrega el repositorio original como upstream
git remote add upstream https://github.com/rolas91sanmartin/FormatPrinterIA.git
```

### 2. Crea una Rama

```bash
# Crea una rama para tu feature o bugfix
git checkout -b feature/mi-nueva-funcionalidad
# o
git checkout -b fix/mi-correccion-de-bug
```

### 3. Instala Dependencias

```bash
npm install
```

### 4. Desarrolla

Sigue estos principios:

- **Clean Architecture**: Mantén la separación de capas
- **SOLID Principles**: Código mantenible y escalable
- **TypeScript**: Usa tipos adecuados
- **Comentarios**: Documenta código complejo
- **Convenciones**: Sigue el estilo del proyecto

### 5. Prueba tus Cambios

```bash
# Ejecuta en modo desarrollo
npm run dev

# Compila para producción
npm run build
```

### 6. Commit

Usa mensajes descriptivos en español:

```bash
git add .
git commit -m "feat: Agrega funcionalidad de exportar plantillas"
# o
git commit -m "fix: Corrige error en la detección de campos"
```

Tipos de commit:
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Formato, sin cambios de código
- `refactor`: Refactorización
- `test`: Agregar tests
- `chore`: Mantenimiento

### 7. Push y Pull Request

```bash
git push origin feature/mi-nueva-funcionalidad
```

Luego, ve a GitHub y crea un Pull Request con:
- **Título claro** de qué hace tu PR
- **Descripción detallada** de los cambios
- **Screenshots** si hay cambios visuales
- **Referencias** a issues relacionados

## 📋 Estructura del Código

### Capa de Dominio (`src/domain/`)
- **Entidades**: Modelos de datos puros
- **Repositorios**: Interfaces de acceso a datos
- **Servicios**: Interfaces de servicios externos

### Capa de Aplicación (`src/application/`)
- **Casos de Uso**: Lógica de negocio
- Un caso de uso por funcionalidad

### Capa de Infraestructura (`src/infrastructure/`)
- **Implementaciones** de repositorios y servicios
- Acceso a base de datos, APIs, etc.

### Capa de Presentación (`src/renderer/`)
- **Componentes React**
- **Páginas**
- **Contextos**
- **Estilos**

### Proceso Principal (`src/main/`)
- **Electron main process**
- **IPC handlers**

## 🎨 Estilo de Código

### TypeScript

```typescript
// Interfaces con I al inicio para repositorios y servicios
interface IUserRepository {
  findById(id: string): Promise<User | null>;
}

// Clases con PascalCase
class UserService {
  constructor(private repository: IUserRepository) {}
}

// Funciones con camelCase
function getUserById(id: string): Promise<User> {
  // ...
}

// Constantes en UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
```

### React

```tsx
// Componentes funcionales con TypeScript
const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<string>('');
  
  return (
    <div className="my-component">
      {/* contenido */}
    </div>
  );
};
```

## 🐛 Reportar Bugs

Crea un issue con:
- **Título descriptivo**
- **Pasos para reproducir**
- **Comportamiento esperado**
- **Comportamiento actual**
- **Screenshots** si es posible
- **Versión** de la aplicación
- **Sistema operativo**

## 💡 Sugerir Funcionalidades

Crea un issue con:
- **Título claro**
- **Descripción detallada** de la funcionalidad
- **Casos de uso**
- **Mockups** si es posible
- **Justificación** de por qué es útil

## ✅ Checklist para Pull Requests

Antes de crear tu PR, verifica:

- [ ] El código compila sin errores
- [ ] Seguiste la arquitectura del proyecto
- [ ] Agregaste tipos TypeScript apropiados
- [ ] El código está documentado
- [ ] Actualizaste el README si es necesario
- [ ] Probaste la funcionalidad manualmente
- [ ] No hay console.logs olvidados
- [ ] Los commits tienen mensajes descriptivos

## 📝 Áreas de Contribución

### Prioridad Alta
- [ ] Mejoras en la precisión del reconocimiento de documentos
- [ ] Soporte para más formatos de documento
- [ ] Editor manual de posiciones de campos
- [ ] Exportar/Importar plantillas
- [ ] Tests automatizados

### Prioridad Media
- [ ] Temas de color (dark mode)
- [ ] Shortcuts de teclado
- [ ] Histórico de impresiones
- [ ] Múltiples idiomas
- [ ] Mejoras de UI/UX

### Prioridad Baja
- [ ] Estadísticas de uso
- [ ] Backup automático
- [ ] Sincronización en la nube (opcional)

## 🤝 Código de Conducta

- Sé respetuoso con otros contribuidores
- Acepta críticas constructivas
- Enfócate en lo mejor para el proyecto
- Ayuda a otros cuando puedas

## 📞 Contacto

Si tienes preguntas sobre cómo contribuir:
- Abre un issue con la etiqueta `question`
- Revisa los issues existentes

---

¡Gracias por contribuir a FormatPrinter IA! 🎉

