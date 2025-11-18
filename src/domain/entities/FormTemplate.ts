// Elemento estático (texto, línea, rectángulo, imagen)
export interface StaticElement {
  id: string;
  type: 'text' | 'line' | 'rectangle' | 'image' | 'logo';
  content?: string; // Para texto
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | 'bolder' | number;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double';
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    lineHeight?: number;
    padding?: number;
  };
}

// Campo de entrada editable
export interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'textarea';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold' | 'bolder' | number;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
    textAlign?: 'left' | 'center' | 'right';
    padding?: number;
  };
  placeholder?: string;
  required: boolean;
  defaultValue?: string;
}

// Definición de tabla
export interface TableDefinition {
  id: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  columns: Array<{
    id: string;
    header: string;
    width: number; // Porcentaje o píxeles
    type: 'text' | 'number' | 'date';
  }>;
  minRows: number;
  maxRows: number;
  rowHeight: number;
  style: {
    headerBackgroundColor?: string;
    headerColor?: string;
    headerFontWeight?: 'normal' | 'bold';
    borderColor?: string;
    borderWidth?: number;
    fontSize?: number;
    fontFamily?: string;
  };
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  userId: string;
  backgroundImage: string; // Base64 o path de la imagen del documento original
  
  // Elementos del formulario
  staticElements: StaticElement[]; // Textos fijos, líneas, rectángulos
  fields: FormField[]; // Campos editables
  tables: TableDefinition[]; // Tablas dinámicas
  
  pageSize: {
    width: number;
    height: number;
  };
  
  // Configuración de renderizado
  renderMode: 'hybrid' | 'html-only' | 'image-overlay'; // hybrid, html-only, image-overlay
  
  // Configuración de API y numeración
  apiConfiguration?: ApiConfiguration;
  numerationConfig?: NumerationConfig;
  fieldMappings?: FieldMapping[];
  tableMappings?: TableMapping[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFormTemplateDTO {
  name: string;
  description?: string;
  userId: string;
  documentFile: Buffer;
  documentType: 'pdf' | 'image';
}

export interface FormFieldValue {
  fieldId: string;
  value: string | number | boolean;
}

export interface FilledForm {
  templateId: string;
  values: FormFieldValue[];
}

// Configuración de API para envío de datos
export interface ApiConfiguration {
  enabled: boolean;
  endpoint: string; // URL de la API
  method: 'POST' | 'PUT' | 'PATCH';
  headers: Record<string, string>; // Headers personalizados
  authentication?: {
    type: 'none' | 'bearer' | 'apikey' | 'basic';
    token?: string; // Para Bearer
    apiKey?: string; // Para API Key
    apiKeyHeader?: string; // Nombre del header (ej: "X-API-Key")
    username?: string; // Para Basic Auth
    password?: string; // Para Basic Auth
  };
  dataFormat?: 'structured' | 'flat' | 'custom'; // Formato del JSON a enviar
  customTemplate?: string; // Plantilla JSON personalizada (solo si dataFormat es 'custom')
  beforeSend?: {
    validateRequired: boolean;
  };
  onSuccess?: {
    showMessage: boolean;
    message?: string;
    clearForm: boolean;
  };
  onError?: {
    showMessage: boolean;
    message?: string;
    retryable: boolean;
  };
  timeout?: number; // milliseconds
}

// Configuración de numeración automática
export interface NumerationConfig {
  enabled: boolean;
  type: 'sequential' | 'date-based' | 'custom';
  prefix?: string; // Ej: "INV-", "FORM-"
  suffix?: string;
  padding: number; // Cantidad de ceros (ej: 5 = 00001)
  fieldId: string; // ID del campo donde se mostrará el número
  autoIncrement: boolean;
  startFrom?: number;
  dateFormat?: string; // Para tipo date-based: "YYYYMMDD"
  customPattern?: string; // Ej: "{prefix}{date}-{seq}{suffix}"
}

// Mapeo de campos del formulario a la API
export interface FieldMapping {
  fieldId: string; // ID del campo en el formulario
  apiKey: string; // Nombre del campo en la API
  transform?: {
    type: 'none' | 'uppercase' | 'lowercase' | 'trim';
  };
  required?: boolean;
  defaultValue?: any;
}

// Mapeo de tablas del formulario a la API
export interface TableMapping {
  tableId: string; // ID de la tabla en el formulario
  apiKey: string; // Nombre de la tabla/array en la API
  enabled: boolean; // Si se debe incluir en el envío
  columnMappings: {
    columnId: string; // ID de la columna en el formulario
    apiKey: string; // Nombre de la columna en la API
    transform?: {
      type: 'none' | 'uppercase' | 'lowercase' | 'trim';
    };
  }[];
}

// Entidad para almacenar secuencias de numeración
export interface FormSequence {
  templateId: string;
  lastNumber: number;
  lastUsed: Date;
}

// Entidad para formularios completados y enviados
export interface SubmittedForm {
  id: string;
  templateId: string;
  submittedBy: string; // userId
  formNumber: string; // Número/folio generado
  fieldValues: Record<string, any>;
  apiResponse?: any; // Respuesta de la API
  apiStatus?: 'pending' | 'success' | 'error';
  apiError?: string;
  submittedAt: Date;
}

