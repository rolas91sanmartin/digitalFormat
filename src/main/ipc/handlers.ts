import { ipcMain, dialog, BrowserWindow } from 'electron';
import { DatabaseConnection } from '../../infrastructure/database/DatabaseConnection';
import { SQLiteUserRepository } from '../../infrastructure/repositories/SQLiteUserRepository';
import { SQLiteFormTemplateRepository } from '../../infrastructure/repositories/SQLiteFormTemplateRepository';
import { OpenAIDocumentRecognitionService } from '../../infrastructure/services/OpenAIDocumentRecognitionService';
import { RegisterUser } from '../../application/use-cases/auth/RegisterUser';
import { LoginUser } from '../../application/use-cases/auth/LoginUser';
import { CreateFormTemplate } from '../../application/use-cases/forms/CreateFormTemplate';
import { GetUserFormTemplates } from '../../application/use-cases/forms/GetUserFormTemplates';
import { GetFormTemplateById } from '../../application/use-cases/forms/GetFormTemplateById';
import { DeleteFormTemplate } from '../../application/use-cases/forms/DeleteFormTemplate';
import { UpdateFormTemplate } from '../../application/use-cases/forms/UpdateFormTemplate';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';

let openaiApiKey: string = '';

export function setupIpcHandlers() {
  const db = DatabaseConnection.getInstance();
  const userRepository = new SQLiteUserRepository(db);
  const formTemplateRepository = new SQLiteFormTemplateRepository(db);

  // Cargar API Key si existe
  loadApiKey();

  // Auth handlers
  ipcMain.handle('auth:register', async (_event, data) => {
    try {
      const registerUser = new RegisterUser(userRepository);
      const user = await registerUser.execute(data);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('auth:login', async (_event, data) => {
    try {
      const loginUser = new LoginUser(userRepository);
      const user = await loginUser.execute(data);
      return { success: true, user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Form template handlers
  ipcMain.handle('forms:create', async (_event, data) => {
    try {
      if (!openaiApiKey) {
        throw new Error('Por favor, configura tu API Key de OpenAI en la configuración');
      }

      const documentRecognitionService = new OpenAIDocumentRecognitionService(openaiApiKey);
      const createFormTemplate = new CreateFormTemplate(formTemplateRepository, documentRecognitionService);
      
      const buffer = Buffer.from(data.fileBuffer);
      const template = await createFormTemplate.execute({
        name: data.name,
        description: data.description,
        userId: data.userId,
        documentFile: buffer,
        documentType: data.fileType
      });

      return { success: true, template };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('forms:getUserTemplates', async (_event, userId) => {
    try {
      const getUserFormTemplates = new GetUserFormTemplates(formTemplateRepository);
      const templates = await getUserFormTemplates.execute(userId);
      return { success: true, templates };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('forms:getById', async (_event, id) => {
    try {
      const getFormTemplateById = new GetFormTemplateById(formTemplateRepository);
      const template = await getFormTemplateById.execute(id);
      return { success: true, template };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('forms:update', async (_event, data) => {
    try {
      const updateFormTemplate = new UpdateFormTemplate(formTemplateRepository);
      const template = await updateFormTemplate.execute(data.id, data.userId, data.updates);
      return { success: true, template };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('forms:delete', async (_event, data) => {
    try {
      const deleteFormTemplate = new DeleteFormTemplate(formTemplateRepository);
      await deleteFormTemplate.execute(data.id, data.userId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('forms:import', async (_event, data) => {
    try {
      // Crear un nuevo template basado en la configuración importada
      const templateData = {
        name: data.templateData.name,
        description: data.templateData.description,
        userId: data.userId,
        backgroundImage: data.templateData.backgroundImage,
        fields: data.templateData.fields || [],
        tables: data.templateData.tables || [],
        staticElements: data.templateData.staticElements || [],
        pageSize: data.templateData.pageSize || { width: 794, height: 1123 },
        renderMode: data.templateData.renderMode || 'hybrid' as 'hybrid' | 'html-only' | 'image-overlay'
      };

      const template = await formTemplateRepository.create(templateData);
      return { success: true, template };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // File selection handler
  ipcMain.handle('file:select', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Imágenes', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
        { name: 'Todos los archivos', extensions: ['*'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const filePath = result.filePaths[0];
    const buffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === '.pdf' ? 'pdf' : 'image';

    return {
      filePath,
      buffer: buffer.buffer,
      type
    };
  });

  // Print handler
  ipcMain.handle('print:form', async (_event, htmlContent) => {
    try {
      const win = new BrowserWindow({ show: false });
      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
      
      win.webContents.print({
        silent: false,
        printBackground: true,
        margins: { marginType: 'none' }
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Print actual contenido visible con fondos por Chromium
  ipcMain.handle('print:current', async (event, options) => {
    try {
      const sender = BrowserWindow.fromWebContents(event.sender);
      if (!sender) {
        return { success: false, error: 'No se encontró la ventana emisora' };
      }
      const printOptions = {
        silent: false,
        printBackground: true,
        margins: { marginType: 'none' },
        landscape: false,
        ...options,
      } as Electron.WebContentsPrintOptions;
      return await new Promise((resolve) => {
        sender.webContents.print(printOptions, (success, failureReason) => {
          if (success) resolve({ success: true });
          else resolve({ success: false, error: failureReason || 'Error al imprimir' });
        });
      });
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // Settings handlers
  ipcMain.handle('settings:getApiKey', async () => {
    return openaiApiKey;
  });

  ipcMain.handle('settings:setApiKey', async (_event, apiKey) => {
    openaiApiKey = apiKey;
    saveApiKey(apiKey);
  });
}

function getSettingsPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'settings.json');
}

function loadApiKey() {
  try {
    const settingsPath = getSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      openaiApiKey = settings.openaiApiKey || '';
    }
  } catch (error) {
    console.error('Error al cargar configuración:', error);
  }
}

function saveApiKey(apiKey: string) {
  try {
    const settingsPath = getSettingsPath();
    const settings = { openaiApiKey: apiKey };
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error al guardar configuración:', error);
  }
}
