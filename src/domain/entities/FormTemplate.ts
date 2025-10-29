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

