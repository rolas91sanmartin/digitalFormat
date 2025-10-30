import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { DatabaseConnection } from '../infrastructure/database/DatabaseConnection';
import { setupIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

// Crear archivo de log
const logPath = path.join(app.getPath('userData'), 'app.log');
function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (err) {
    console.error('Error escribiendo log:', err);
  }
}

log('='.repeat(80));
log('INICIANDO APLICACIÓN');
log(`Versión: ${app.getVersion()}`);
log(`userData: ${app.getPath('userData')}`);
log(`appPath: ${app.getAppPath()}`);
log(`isPackaged: ${app.isPackaged}`);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 1000,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    title: 'FormatPrinter IA - By rsanchez@sanmartin.com.ni'
  });

  const isDev = process.argv.includes('--dev');

  log(`isDev: ${isDev}`);

  // En desarrollo, cargar desde el servidor de Vite y abrir DevTools
  if (!app.isPackaged && isDev) {
    log('Cargando desde servidor de desarrollo (http://localhost:5173)');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // En producción, cargar el HTML compilado SIN abrir DevTools
    const htmlPath = path.join(__dirname, '../../renderer/index.html');
    log(`Cargando HTML desde: ${htmlPath}`);
    log(`__dirname: ${__dirname}`);
    log(`Archivo existe: ${fs.existsSync(htmlPath)}`);

    if (fs.existsSync(htmlPath)) {
      mainWindow.loadFile(htmlPath).catch(err => {
        log(`ERROR al cargar archivo: ${err}`);
      });
    } else {
      log('ERROR: El archivo index.html no existe en la ruta especificada');

      // Intentar rutas alternativas
      const alternativePaths = [
        path.join(process.resourcesPath, 'app.asar', 'dist', 'renderer', 'index.html'),
        path.join(process.resourcesPath, 'app', 'dist', 'renderer', 'index.html'),
        path.join(__dirname, '../renderer/index.html'),
      ];

      for (const altPath of alternativePaths) {
        log(`Intentando ruta alternativa: ${altPath}`);
        if (fs.existsSync(altPath)) {
          log(`✓ Encontrado en: ${altPath}`);
          mainWindow.loadFile(altPath);
          break;
        }
      }
    }
  }

  // Logs para debugging
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log(`ERROR did-fail-load: ${errorCode} - ${errorDescription}`);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    log('✓ Página cargada exitosamente');
  });

  mainWindow.webContents.on('dom-ready', () => {
    log('✓ DOM listo');
  });

  // Atajos para abrir DevTools: deshabilitados en app empaquetada
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (app.isPackaged) return; // Nunca permitir atajos en producción
    const isDevEnv = process.argv.includes('--dev');
    if (!isDevEnv) return;
    if (input.type === 'keyDown') {
      if (input.key === 'F12' || (input.control && input.shift && input.key === 'I')) {
        mainWindow?.webContents.toggleDevTools();
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  log('✓ App ready');

  try {
    // Inicializar base de datos
    log('Inicializando base de datos...');
    DatabaseConnection.getInstance();
    log('✓ Base de datos inicializada');
  } catch (err: any) {
    log(`ERROR inicializando base de datos: ${err.message}`);
    log(`Stack: ${err.stack}`);
  }

  try {
    // Configurar manejadores IPC
    log('Configurando manejadores IPC...');
    setupIpcHandlers();
    log('✓ Manejadores IPC configurados');
  } catch (err: any) {
    log(`ERROR configurando IPC: ${err.message}`);
  }

  try {
    log('Creando ventana...');
    createWindow();
    log('✓ Ventana creada');
  } catch (err: any) {
    log(`ERROR creando ventana: ${err.message}`);
    log(`Stack: ${err.stack}`);
  }

  app.on('activate', () => {
    log('Evento activate');
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}).catch(err => {
  log(`ERROR FATAL en app.whenReady: ${err}`);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    DatabaseConnection.close();
    app.quit();
  }
});

app.on('before-quit', () => {
  DatabaseConnection.close();
});

