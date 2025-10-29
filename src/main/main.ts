import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { DatabaseConnection } from '../infrastructure/database/DatabaseConnection';
import { setupIpcHandlers } from './ipc/handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    title: 'FormatPrinter IA'
  });

  // En desarrollo, cargar desde el servidor de Vite
  if (process.argv.includes('--dev')) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción, cargar el HTML compilado
    mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Inicializar base de datos
  DatabaseConnection.getInstance();
  
  // Configurar manejadores IPC
  setupIpcHandlers();
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
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

