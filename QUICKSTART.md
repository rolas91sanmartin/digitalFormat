# 🚀 Guía de Inicio Rápido

## Para Desarrolladores

### 1. Instalación Rápida

```bash
# Clonar repositorio
git clone https://github.com/rolas91sanmartin/FormatPrinterIA.git
cd FormatPrinterIA

# Instalar dependencias
npm install
```

### 2. Ejecutar en Desarrollo

```bash
# Inicia la aplicación en modo desarrollo
npm run dev
```

Esto iniciará:
- ✅ Vite dev server en http://localhost:5173
- ✅ Electron con hot-reload
- ✅ TypeScript watch mode

### 3. Compilar para Producción

```bash
# Compila todo el proyecto
npm run build

# Crea el instalador
npm run package
```

El instalador estará en la carpeta `release/`.

---

## Para Usuarios Finales

### 1. Descargar e Instalar

1. Descarga el instalador desde [Releases](https://github.com/rolas91sanmartin/FormatPrinterIA/releases)
2. Ejecuta el instalador
3. Abre la aplicación

### 2. Primera Configuración (5 minutos)

#### Paso 1: Crear cuenta
- Usuario: `tunombre`
- Email: `tu@email.com`
- Contraseña: `minimo6caracteres`

#### Paso 2: Obtener API Key
1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API Key
3. Copia la clave (empieza con `sk-...`)

#### Paso 3: Configurar en la App
1. Abre la app → **Configuración** (⚙️)
2. Pega tu API Key
3. Guarda

### 3. Crear tu Primer Formulario (2 minutos)

1. **Dashboard** → **+ Nuevo Formulario**
2. Selecciona un documento (PDF o imagen)
3. Espera 10-30 segundos (la IA lo analiza)
4. ¡Listo! Ya puedes usarlo

### 4. Usar el Formulario (1 minuto)

1. Abre la plantilla desde el Dashboard
2. Rellena los campos en el panel izquierdo
3. Ve la vista previa en tiempo real
4. **🖨️ Imprimir** cuando esté listo

---

## Comandos Útiles

### Desarrollo

```bash
# Ejecutar en desarrollo
npm run dev

# Solo compilar TypeScript (main process)
npm run build:main

# Solo compilar React (renderer)
npm run build:renderer

# Compilar todo
npm run build
```

### Producción

```bash
# Crear instalador
npm run package

# Ejecutar versión compilada
npm start
```

### Limpieza

```bash
# Eliminar dependencias
rm -rf node_modules/

# Eliminar archivos compilados
rm -rf dist/

# Eliminar instaladores
rm -rf release/

# Reinstalar todo
npm install
```

---

## Estructura Básica del Proyecto

```
FormatPrinterIA/
├── src/
│   ├── domain/          # Entidades y contratos
│   ├── application/     # Casos de uso
│   ├── infrastructure/  # Implementaciones (BD, APIs)
│   ├── main/           # Electron main process
│   └── renderer/       # React UI
├── dist/               # Código compilado
├── release/            # Instaladores
└── package.json        # Configuración npm
```

---

## Tecnologías Principales

- **Electron** - Framework de escritorio
- **React** - UI
- **TypeScript** - Lenguaje
- **SQLite** - Base de datos
- **OpenAI** - IA para reconocimiento
- **Vite** - Build tool

---

## Solución de Problemas Comunes

### Error: "Cannot find module 'electron'"
```bash
npm install
```

### Error: "API Key no configurada"
Ve a Configuración y agrega tu API Key de OpenAI

### Error en compilación
```bash
# Limpia y reinstala
rm -rf node_modules dist
npm install
npm run build
```

### La app no inicia
1. Verifica que Node.js esté instalado
2. Verifica que las dependencias estén instaladas
3. Revisa los logs en la consola

### Problemas con la impresión
1. Verifica que la impresora esté conectada
2. Instala los drivers de la impresora
3. Configura la impresora como predeterminada

---

## Próximos Pasos

### Desarrolladores
- Lee el [README.md](README.md) completo
- Revisa la [Guía de Contribución](CONTRIBUTING.md)
- Explora el código siguiendo Clean Architecture

### Usuarios
- Lee el [Manual de Uso](MANUAL_DE_USO.md) completo
- Prueba con diferentes tipos de documentos
- Reporta bugs en [Issues](https://github.com/rolas91sanmartin/FormatPrinterIA/issues)

---

## Recursos

- **Documentación de Electron**: https://www.electronjs.org/docs
- **Documentación de React**: https://react.dev
- **OpenAI API**: https://platform.openai.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## Soporte

- **Issues**: https://github.com/rolas91sanmartin/FormatPrinterIA/issues
- **Discussions**: https://github.com/rolas91sanmartin/FormatPrinterIA/discussions

---

**¡Listo para empezar!** 🎉

Si tienes dudas, revisa la documentación completa o abre un issue.

