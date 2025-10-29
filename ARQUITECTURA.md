# 🏗️ Arquitectura del Sistema

## Visión General

FormatPrinter IA está construido siguiendo los principios de **Clean Architecture** (Arquitectura Limpia), lo que garantiza un código mantenible, testeable y escalable.

## Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    PRESENTACIÓN                         │
│                  (src/renderer/)                        │
│  ┌─────────────────────────────────────────────────┐  │
│  │  React Components, Pages, Contexts              │  │
│  │  - Login / Register                             │  │
│  │  - Dashboard                                    │  │
│  │  - FormEditor                                   │  │
│  │  - Settings                                     │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕️ IPC
┌─────────────────────────────────────────────────────────┐
│              PROCESO PRINCIPAL ELECTRON                 │
│                   (src/main/)                           │
│  ┌─────────────────────────────────────────────────┐  │
│  │  IPC Handlers, Window Management                │  │
│  │  - Auth handlers                                │  │
│  │  - Form handlers                                │  │
│  │  - File handlers                                │  │
│  │  - Print handlers                               │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕️
┌─────────────────────────────────────────────────────────┐
│                     APLICACIÓN                          │
│                 (src/application/)                      │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Use Cases (Casos de Uso)                       │  │
│  │  ┌─────────────────┐  ┌────────────────────┐   │  │
│  │  │  Auth           │  │  Forms             │   │  │
│  │  │  - RegisterUser │  │  - CreateTemplate  │   │  │
│  │  │  - LoginUser    │  │  - GetTemplates    │   │  │
│  │  └─────────────────┘  │  - DeleteTemplate  │   │  │
│  │                       └────────────────────┘   │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕️
┌─────────────────────────────────────────────────────────┐
│                      DOMINIO                            │
│                   (src/domain/)                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Entities (Entidades)                           │  │
│  │  - User                                         │  │
│  │  - FormTemplate                                 │  │
│  │  - FormField                                    │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Repository Interfaces                          │  │
│  │  - IUserRepository                              │  │
│  │  - IFormTemplateRepository                      │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Service Interfaces                             │  │
│  │  - IDocumentRecognitionService                  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕️
┌─────────────────────────────────────────────────────────┐
│                  INFRAESTRUCTURA                        │
│                (src/infrastructure/)                    │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Repository Implementations                     │  │
│  │  - SQLiteUserRepository                         │  │
│  │  - SQLiteFormTemplateRepository                 │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Service Implementations                        │  │
│  │  - OpenAIDocumentRecognitionService             │  │
│  └─────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Database                                       │  │
│  │  - DatabaseConnection (SQLite)                  │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         ↕️
┌─────────────────────────────────────────────────────────┐
│                 SERVICIOS EXTERNOS                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   OpenAI     │  │   SQLite     │  │  Printer   │  │
│  │   GPT-4      │  │   Database   │  │  System    │  │
│  │   Vision     │  │              │  │            │  │
│  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Flujo de Datos

### 1. Flujo de Creación de Plantilla

```
Usuario → Dashboard (UI)
    ↓
Selecciona Documento
    ↓
IPC: createFormTemplate
    ↓
CreateFormTemplate (Use Case)
    ↓
OpenAIDocumentRecognitionService
    ↓
OpenAI API (Análisis del documento)
    ↓
FormTemplateRepository (Guardar en BD)
    ↓
SQLite Database
    ↓
Respuesta al Usuario
```

### 2. Flujo de Rellenado e Impresión

```
Usuario → FormEditor (UI)
    ↓
Rellena Campos
    ↓
Vista Previa en Tiempo Real
    ↓
Click en Imprimir
    ↓
IPC: printForm
    ↓
Electron Print API
    ↓
Sistema de Impresión del SO
    ↓
Documento Impreso
```

### 3. Flujo de Autenticación

```
Usuario → Login (UI)
    ↓
Ingresa credenciales
    ↓
IPC: login
    ↓
LoginUser (Use Case)
    ↓
UserRepository (Buscar usuario)
    ↓
SQLite Database
    ↓
Verificación de contraseña (bcrypt)
    ↓
Token/Sesión
    ↓
LocalStorage
    ↓
Redirección a Dashboard
```

## Principios SOLID Aplicados

### Single Responsibility Principle (SRP)
- Cada caso de uso tiene una única responsabilidad
- Cada repositorio maneja una sola entidad
- Separación clara entre capas

### Open/Closed Principle (OCP)
- Interfaces para repositorios y servicios
- Fácil agregar nuevas implementaciones sin modificar código existente

### Liskov Substitution Principle (LSP)
- Las implementaciones concretas pueden sustituir a sus interfaces
- SQLiteUserRepository implementa IUserRepository completamente

### Interface Segregation Principle (ISP)
- Interfaces pequeñas y específicas
- No hay métodos innecesarios en las interfaces

### Dependency Inversion Principle (DIP)
- Los casos de uso dependen de interfaces, no de implementaciones
- Inyección de dependencias en constructores

## Tecnologías por Capa

### Capa de Presentación
- **React** 18.2.0 - Librería de UI
- **React Router** 6.21.0 - Navegación
- **CSS3** - Estilos modernos

### Proceso Principal
- **Electron** 28.0.0 - Framework de escritorio
- **IPC** - Comunicación entre procesos

### Capa de Aplicación
- **TypeScript** 5.3.3 - Lógica de negocio tipada

### Capa de Dominio
- **TypeScript** 5.3.3 - Entidades e interfaces puras

### Capa de Infraestructura
- **better-sqlite3** 9.2.2 - SQLite
- **OpenAI SDK** 4.20.1 - IA
- **bcrypt** 5.1.1 - Encriptación

## Patrones de Diseño Utilizados

### Repository Pattern
```typescript
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  create(user: CreateUserDTO): Promise<User>;
  // ...
}
```

### Dependency Injection
```typescript
class RegisterUser {
  constructor(private userRepository: IUserRepository) {}
  
  async execute(data: CreateUserDTO): Promise<User> {
    // ...
  }
}
```

### Strategy Pattern
- Diferentes servicios de reconocimiento de documentos pueden implementar la misma interfaz

### Singleton Pattern
- DatabaseConnection usa singleton para una única instancia

## Seguridad

### Context Isolation
- Electron con context isolation habilitado
- Preload script con API segura expuesta

### Almacenamiento Seguro
- Contraseñas hasheadas con bcrypt (salt rounds: 10)
- API Keys almacenadas localmente en archivos protegidos
- No se envían credenciales a servidores externos

### Validaciones
- Validación de datos en cada capa
- Sanitización de inputs del usuario
- Verificación de permisos en operaciones críticas

## Base de Datos

### Esquema

**users**
- id (TEXT, PK)
- username (TEXT, UNIQUE)
- email (TEXT, UNIQUE)
- passwordHash (TEXT)
- createdAt (TEXT)
- updatedAt (TEXT)

**form_templates**
- id (TEXT, PK)
- name (TEXT)
- description (TEXT, nullable)
- userId (TEXT, FK → users.id)
- backgroundImage (TEXT)
- fields (TEXT, JSON)
- pageWidth (INTEGER)
- pageHeight (INTEGER)
- createdAt (TEXT)
- updatedAt (TEXT)

### Índices
- `idx_form_templates_userId` en form_templates(userId)

## Escalabilidad

### Extensiones Futuras Posibles

1. **Múltiples Servicios de IA**
   - Agregar implementaciones alternativas de IDocumentRecognitionService
   - Google Vision, AWS Textract, etc.

2. **Cloud Storage**
   - Implementar nuevos repositorios para almacenamiento en la nube
   - Mantener mismas interfaces

3. **Múltiples Bases de Datos**
   - PostgreSQL, MongoDB, etc.
   - Solo cambiar implementación del repositorio

4. **Multi-idioma**
   - Agregar capa de internacionalización
   - Sin cambios en la arquitectura base

5. **Tests**
   - Fácil mockear interfaces para testing
   - Tests unitarios por capa

## Mantenibilidad

### Ventajas de esta Arquitectura

✅ **Separación de Responsabilidades**: Cada capa tiene un propósito claro

✅ **Testeable**: Fácil mockear dependencias y testear cada capa

✅ **Escalable**: Agregar funcionalidades sin romper código existente

✅ **Independencia de Frameworks**: La lógica de negocio no depende de React o Electron

✅ **Documentación Clara**: Estructura predecible y estándar

✅ **Reutilizable**: Los casos de uso pueden usarse desde diferentes UIs

---

## Referencias

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Electron Architecture](https://www.electronjs.org/docs/latest/tutorial/process-model)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

**Esta arquitectura garantiza un código mantenible y escalable a largo plazo.** 🏗️

