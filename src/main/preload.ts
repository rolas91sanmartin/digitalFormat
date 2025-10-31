import { contextBridge, ipcRenderer } from 'electron';

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  register: (username: string, email: string, password: string) => 
    ipcRenderer.invoke('auth:register', { username, email, password }),
  
  login: (email: string, password: string) => 
    ipcRenderer.invoke('auth:login', { email, password }),

  // Form Templates
  createFormTemplate: (name: string, description: string, userId: string, fileBuffer: ArrayBuffer, fileType: string) =>
    ipcRenderer.invoke('forms:create', { name, description, userId, fileBuffer, fileType }),
  
  getUserFormTemplates: (userId: string) =>
    ipcRenderer.invoke('forms:getUserTemplates', userId),
  
  getFormTemplateById: (id: string) =>
    ipcRenderer.invoke('forms:getById', id),
  
  getFormTemplate: (id: string) =>
    ipcRenderer.invoke('forms:getById', id),
  
  updateFormTemplate: (id: string, userId: string, updates: any) =>
    ipcRenderer.invoke('forms:update', { id, userId, updates }),
  
  deleteFormTemplate: (id: string, userId: string) =>
    ipcRenderer.invoke('forms:delete', { id, userId }),
  
  importFormTemplate: (userId: string, templateData: any) =>
    ipcRenderer.invoke('forms:import', { userId, templateData }),

  // Printing
  printForm: (htmlContent: string) =>
    ipcRenderer.invoke('print:form', htmlContent),
  printWithBackground: (options?: any) =>
    ipcRenderer.invoke('print:current', options),

  // File operations
  selectFile: () =>
    ipcRenderer.invoke('file:select'),

  // Settings
  getApiKey: () =>
    ipcRenderer.invoke('settings:getApiKey'),
  
  setApiKey: (apiKey: string) =>
    ipcRenderer.invoke('settings:setApiKey', apiKey)
});

export type ElectronAPI = {
  register: (username: string, email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  createFormTemplate: (name: string, description: string, userId: string, fileBuffer: ArrayBuffer, fileType: string) => Promise<any>;
  getUserFormTemplates: (userId: string) => Promise<any>;
  getFormTemplateById: (id: string) => Promise<any>;
  getFormTemplate: (id: string) => Promise<any>;
  updateFormTemplate: (id: string, userId: string, updates: any) => Promise<any>;
  deleteFormTemplate: (id: string, userId: string) => Promise<any>;
  importFormTemplate: (userId: string, templateData: any) => Promise<any>;
  printForm: (htmlContent: string) => Promise<any>;
  printWithBackground: (options?: any) => Promise<any>;
  selectFile: () => Promise<{ filePath: string; buffer: ArrayBuffer; type: string } | null>;
  getApiKey: () => Promise<string>;
  setApiKey: (apiKey: string) => Promise<void>;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

