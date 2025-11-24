import { contextBridge, ipcRenderer } from 'electron';

// Exponer API segura al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  register: (username: string, email: string, password: string) => 
    ipcRenderer.invoke('auth:register', { username, email, password }),
  
  login: (email: string, password: string) => 
    ipcRenderer.invoke('auth:login', { email, password }),
  
  requestPasswordReset: (email: string) =>
    ipcRenderer.invoke('auth:requestPasswordReset', { email }),
  
  verifyResetCode: (email: string, code: string) =>
    ipcRenderer.invoke('auth:verifyResetCode', { email, code }),
  
  resetPassword: (email: string, code: string, newPassword: string) =>
    ipcRenderer.invoke('auth:resetPassword', { email, code, newPassword }),

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
  
  submitForm: (templateId: string, userId: string, userEmail: string, values: Record<string, any>) =>
    ipcRenderer.invoke('forms:submit', { templateId, userId, userEmail, values }),
  
  getSubmittedForms: (userId: string) =>
    ipcRenderer.invoke('forms:getSubmittedForms', userId),
  
  getSubmittedFormsByTemplate: (templateId: string) =>
    ipcRenderer.invoke('forms:getSubmittedFormsByTemplate', templateId),
  
  retryFormSubmission: (submittedFormId: string) =>
    ipcRenderer.invoke('forms:retrySubmission', submittedFormId),
  
  getNextSequenceNumber: (templateId: string) => 
    ipcRenderer.invoke('forms:getNextSequenceNumber', templateId),
  
  previewNextFolio: (templateId: string) =>
    ipcRenderer.invoke('forms:previewNextFolio', templateId),
  
  getFolioFromExternalApi: (templateId: string) =>
    ipcRenderer.invoke('forms:getFolioFromExternalApi', templateId),
  
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
    ipcRenderer.invoke('settings:setApiKey', apiKey),

  // Updates
  checkForUpdates: () =>
    ipcRenderer.invoke('update:check'),
  
  downloadUpdate: () =>
    ipcRenderer.invoke('update:download'),
  
  installUpdate: () =>
    ipcRenderer.invoke('update:install'),
  
  onUpdateAvailable: (callback: (info: any) => void) => {
    ipcRenderer.on('update:available', (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners('update:available');
  },
  
  onUpdateNotAvailable: (callback: () => void) => {
    ipcRenderer.on('update:not-available', () => callback());
    return () => ipcRenderer.removeAllListeners('update:not-available');
  },
  
  onDownloadProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('update:download-progress', (_event, progress) => callback(progress));
    return () => ipcRenderer.removeAllListeners('update:download-progress');
  },
  
  onUpdateDownloaded: (callback: (info: any) => void) => {
    ipcRenderer.on('update:downloaded', (_event, info) => callback(info));
    return () => ipcRenderer.removeAllListeners('update:downloaded');
  },
  
  onUpdateError: (callback: (error: string) => void) => {
    ipcRenderer.on('update:error', (_event, error) => callback(error));
    return () => ipcRenderer.removeAllListeners('update:error');
  }
});

export type ElectronAPI = {
  register: (username: string, email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  verifyResetCode: (email: string, code: string) => Promise<any>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<any>;
  createFormTemplate: (name: string, description: string, userId: string, fileBuffer: ArrayBuffer, fileType: string) => Promise<any>;
  getUserFormTemplates: (userId: string) => Promise<any>;
  getFormTemplateById: (id: string) => Promise<any>;
  getFormTemplate: (id: string) => Promise<any>;
  updateFormTemplate: (id: string, userId: string, updates: any) => Promise<any>;
  deleteFormTemplate: (id: string, userId: string) => Promise<any>;
  importFormTemplate: (userId: string, templateData: any) => Promise<any>;
  submitForm: (templateId: string, userId: string, userEmail: string, values: Record<string, any>) => Promise<any>;
  getSubmittedForms: (userId: string) => Promise<any>;
  getSubmittedFormsByTemplate: (templateId: string) => Promise<any>;
  retryFormSubmission: (submittedFormId: string) => Promise<any>;
  getNextSequenceNumber: (templateId: string) => Promise<any>;
  previewNextFolio: (templateId: string) => Promise<any>;
  getFolioFromExternalApi: (templateId: string) => Promise<any>;
  printForm: (htmlContent: string) => Promise<any>;
  printWithBackground: (options?: any) => Promise<any>;
  selectFile: () => Promise<{ filePath: string; buffer: ArrayBuffer; type: string } | null>;
  getApiKey: () => Promise<string>;
  setApiKey: (apiKey: string) => Promise<void>;
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<any>;
  installUpdate: () => Promise<void>;
  onUpdateAvailable: (callback: (info: any) => void) => () => void;
  onUpdateNotAvailable: (callback: () => void) => () => void;
  onDownloadProgress: (callback: (progress: any) => void) => () => void;
  onUpdateDownloaded: (callback: (info: any) => void) => () => void;
  onUpdateError: (callback: (error: string) => void) => () => void;
};

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

