export interface ElectronAPI {
  register: (username: string, email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  createFormTemplate: (name: string, description: string | undefined, userId: string, fileBuffer: ArrayBuffer, fileType: string) => Promise<any>;
  getUserFormTemplates: (userId: string) => Promise<any>;
  getFormTemplateById: (id: string) => Promise<any>;
  deleteFormTemplate: (id: string, userId: string) => Promise<any>;
  printForm: (htmlContent: string) => Promise<any>;
  selectFile: () => Promise<{ filePath: string; buffer: ArrayBuffer; type: string } | null>;
  getApiKey: () => Promise<string>;
  setApiKey: (apiKey: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

