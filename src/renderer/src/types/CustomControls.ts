// Tipos de controles disponibles
export type ControlType = 
  | 'select' 
  | 'button' 
  | 'radio' 
  | 'file' 
  | 'signature' 
  | 'calculated' 
  | 'label'
  | 'date-picker'
  | 'time-picker'
  | 'color-picker'
  | 'range-slider'
  | 'toggle'
  | 'checkbox';

// Tipos de acciones disponibles
export type ActionType = 
  | 'api-call' 
  | 'set-value' 
  | 'show-hide' 
  | 'calculate' 
  | 'open-url' 
  | 'print' 
  | 'copy' 
  | 'validate' 
  | 'navigate' 
  | 'show-message'
  | 'clear-form'
  | 'submit-form';

// Configuración de una acción
export interface ActionConfig {
  id: string;
  type: ActionType;
  name: string;
  enabled: boolean;
  order: number; // Para encadenamiento
  
  // Para API Call
  apiConfig?: {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    
    // Autenticación
    authType?: 'none' | 'bearer' | 'apikey' | 'basic';
    bearerToken?: string;
    apiKeyHeader?: string;
    apiKeyValue?: string;
    basicUsername?: string;
    basicPassword?: string;
    
    // Headers personalizados
    customHeaders?: { key: string; value: string }[];
    
    // Body (para POST, PUT, PATCH)
    bodyTemplate?: string; // Usa {fieldName} para interpolación
    
    // Mapeo de respuesta
    responseMapping?: { 
      targetFieldId: string; 
      jsonPath: string; 
    }[];
    
    // Timeout
    timeout?: number;
    
    // Validación
    validateBeforeCall?: boolean; // Validar que campos en URL/body tengan valor
  };
  
  // Para Set Value
  setValueConfig?: {
    targetFieldId: string;
    valueType: 'static' | 'from-field' | 'from-response' | 'expression';
    value: string;
  };
  
  // Para Show/Hide
  showHideConfig?: {
    targetFieldId: string;
    action: 'show' | 'hide' | 'toggle';
  };
  
  // Para Calculate
  calculateConfig?: {
    targetFieldId: string;
    formula: string; // Usa {fieldId} para referencias
  };
  
  // Para Open URL
  openUrlConfig?: {
    url: string;
    openIn: 'new-tab' | 'same-window' | 'popup';
  };
  
  // Para Show Message
  showMessageConfig?: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  };
  
  // Para Navigate
  navigateConfig?: {
    target: 'dashboard' | 'back' | 'custom';
    customPath?: string;
  };
  
  // Para Validate
  validateConfig?: {
    errorMessage: string;
    stopOnError: boolean;
  };
  
  // Para Copy
  copyConfig?: {
    sourceFieldId: string;
  };
}

// Opción para Select/Radio
export interface SelectOption {
  id: string;
  label: string;
  value: string;
}

// Configuración específica de cada tipo de control
export interface ControlConfig {
  // Para Select
  selectOptions?: SelectOption[];
  selectPlaceholder?: string;
  selectMultiple?: boolean;
  
  // Para Radio
  radioOptions?: SelectOption[];
  radioLayout?: 'horizontal' | 'vertical';
  
  // Para Button
  buttonText?: string;
  buttonStyle?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  buttonIcon?: string;
  
  // Para Calculated
  formula?: string;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
  displayStyle?: 'input' | 'transparent' | 'underline' | 'bordered' | 'label' | 'badge';
  
  // Label asociado al campo calculado
  showLabel?: boolean;
  labelText?: string;
  labelPosition?: 'top' | 'left' | 'right';
  
  // Para File
  acceptedTypes?: string[];
  maxSizeMB?: number;
  multiple?: boolean;
  
  // Para Signature
  signatureWidth?: number;
  signatureHeight?: number;
  penColor?: string;
  backgroundColor?: string;
  
  // Para Label
  labelText?: string;
  labelStyle?: 'title' | 'subtitle' | 'normal' | 'small';
  
  // Para Date/Time Picker
  dateFormat?: string;
  minDate?: string;
  maxDate?: string;
  
  // Para Range Slider
  minValue?: number;
  maxValue?: number;
  step?: number;
  showValue?: boolean;
  
  // Para Toggle
  toggleOnLabel?: string;
  toggleOffLabel?: string;
  
  // Para Checkbox
  checkboxLabel?: string;
  checkboxDefaultValue?: boolean;
}

// Control personalizado completo
export interface CustomControl {
  id: string;
  type: ControlType;
  name: string;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    borderRadius?: number;
  };
  config: ControlConfig;
  actions: {
    onClick?: ActionConfig[];
    onChange?: ActionConfig[];
    onLoad?: ActionConfig[];
    onBlur?: ActionConfig[];
  };
  required?: boolean;
  disabled?: boolean;
  visible?: boolean;
}

// Información de tipos de controles para el UI
export const CONTROL_TYPES_INFO: Record<ControlType, { 
  icon: string; 
  label: string; 
  description: string;
  category: 'input' | 'action' | 'display' | 'special';
}> = {
  'select': { 
    icon: '📋', 
    label: 'Selector (Dropdown)', 
    description: 'Lista desplegable con opciones',
    category: 'input'
  },
  'button': { 
    icon: '🔵', 
    label: 'Botón', 
    description: 'Botón con acciones personalizadas',
    category: 'action'
  },
  'radio': { 
    icon: '🔘', 
    label: 'Opciones (Radio)', 
    description: 'Grupo de opciones excluyentes',
    category: 'input'
  },
  'file': { 
    icon: '📎', 
    label: 'Subir Archivo', 
    description: 'Permite adjuntar archivos',
    category: 'input'
  },
  'signature': { 
    icon: '✍️', 
    label: 'Firma Digital', 
    description: 'Campo para capturar firma',
    category: 'special'
  },
  'calculated': { 
    icon: '🧮', 
    label: 'Campo Calculado', 
    description: 'Valor calculado automáticamente',
    category: 'display'
  },
  'label': { 
    icon: '🏷️', 
    label: 'Etiqueta/Título', 
    description: 'Texto estático decorativo',
    category: 'display'
  },
  'date-picker': { 
    icon: '📅', 
    label: 'Selector de Fecha', 
    description: 'Calendario para seleccionar fecha',
    category: 'input'
  },
  'time-picker': { 
    icon: '⏰', 
    label: 'Selector de Hora', 
    description: 'Selector de hora',
    category: 'input'
  },
  'color-picker': { 
    icon: '🎨', 
    label: 'Selector de Color', 
    description: 'Selector de color',
    category: 'input'
  },
  'range-slider': { 
    icon: '📊', 
    label: 'Control Deslizante', 
    description: 'Slider para seleccionar valor en rango',
    category: 'input'
  },
  'toggle': { 
    icon: '🔀', 
    label: 'Interruptor (Toggle)', 
    description: 'Switch on/off',
    category: 'input'
  },
  'checkbox': { 
    icon: '☑️', 
    label: 'Casilla de Verificación', 
    description: 'Checkbox para activar/desactivar funcionalidades',
    category: 'input'
  }
};

// Información de tipos de acciones para el UI
export const ACTION_TYPES_INFO: Record<ActionType, { 
  icon: string; 
  label: string; 
  description: string;
}> = {
  'api-call': { 
    icon: '🌐', 
    label: 'Llamar API', 
    description: 'Hacer petición a un endpoint externo' 
  },
  'set-value': { 
    icon: '✏️', 
    label: 'Establecer Valor', 
    description: 'Asignar valor a otro campo' 
  },
  'show-hide': { 
    icon: '👁️', 
    label: 'Mostrar/Ocultar', 
    description: 'Mostrar u ocultar campos' 
  },
  'calculate': { 
    icon: '🧮', 
    label: 'Calcular', 
    description: 'Ejecutar fórmula matemática' 
  },
  'open-url': { 
    icon: '🔗', 
    label: 'Abrir URL', 
    description: 'Abrir enlace en navegador' 
  },
  'print': { 
    icon: '🖨️', 
    label: 'Imprimir', 
    description: 'Imprimir el formulario' 
  },
  'copy': { 
    icon: '📋', 
    label: 'Copiar', 
    description: 'Copiar valor al portapapeles' 
  },
  'validate': { 
    icon: '✅', 
    label: 'Validar', 
    description: 'Validar campos del formulario' 
  },
  'navigate': { 
    icon: '🧭', 
    label: 'Navegar', 
    description: 'Ir a otra página' 
  },
  'show-message': { 
    icon: '💬', 
    label: 'Mostrar Mensaje', 
    description: 'Mostrar alerta o notificación' 
  },
  'clear-form': { 
    icon: '🗑️', 
    label: 'Limpiar Formulario', 
    description: 'Resetear todos los campos' 
  },
  'submit-form': { 
    icon: '📤', 
    label: 'Enviar Formulario', 
    description: 'Guardar y enviar el formulario' 
  }
};

// Helper para crear un nuevo control con valores por defecto
export function createDefaultControl(type: ControlType, position: { x: number; y: number }): CustomControl {
  const baseControl: CustomControl = {
    id: `control_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    name: CONTROL_TYPES_INFO[type].label,
    position: {
      x: position.x,
      y: position.y,
      width: 150,
      height: 40
    },
    style: {
      fontSize: 12,
      fontFamily: 'Arial',
      color: '#000000'
    },
    config: {},
    actions: {},
    required: false,
    disabled: false,
    visible: true
  };

  // Configuración por defecto según tipo
  switch (type) {
    case 'select':
      baseControl.config.selectOptions = [
        { id: '1', label: 'Opción 1', value: 'opcion1' },
        { id: '2', label: 'Opción 2', value: 'opcion2' }
      ];
      baseControl.config.selectPlaceholder = 'Seleccione...';
      baseControl.position.width = 200;
      break;
      
    case 'button':
      baseControl.config.buttonText = 'Clic aquí';
      baseControl.config.buttonStyle = 'primary';
      baseControl.position.width = 120;
      baseControl.position.height = 36;
      break;
      
    case 'radio':
      baseControl.config.radioOptions = [
        { id: '1', label: 'Opción A', value: 'a' },
        { id: '2', label: 'Opción B', value: 'b' }
      ];
      baseControl.config.radioLayout = 'horizontal';
      baseControl.position.width = 250;
      baseControl.position.height = 30;
      break;
      
    case 'calculated':
      baseControl.config.formula = '';
      baseControl.config.decimalPlaces = 2;
      baseControl.config.displayStyle = 'transparent';
      baseControl.config.showLabel = false;
      baseControl.config.labelText = '';
      baseControl.config.labelPosition = 'left';
      baseControl.position.width = 120;
      break;
      
    case 'label':
      baseControl.config.labelText = 'Título';
      baseControl.config.labelStyle = 'title';
      baseControl.position.width = 200;
      baseControl.position.height = 30;
      break;
      
    case 'signature':
      baseControl.config.signatureWidth = 300;
      baseControl.config.signatureHeight = 100;
      baseControl.config.penColor = '#000000';
      baseControl.config.backgroundColor = '#ffffff';
      baseControl.position.width = 300;
      baseControl.position.height = 100;
      break;
      
    case 'file':
      baseControl.config.acceptedTypes = ['pdf', 'jpg', 'png'];
      baseControl.config.maxSizeMB = 5;
      baseControl.position.width = 200;
      break;
      
    case 'toggle':
      baseControl.config.toggleOnLabel = 'Sí';
      baseControl.config.toggleOffLabel = 'No';
      baseControl.position.width = 80;
      baseControl.position.height = 30;
      break;
      
    case 'range-slider':
      baseControl.config.minValue = 0;
      baseControl.config.maxValue = 100;
      baseControl.config.step = 1;
      baseControl.config.showValue = true;
      baseControl.position.width = 200;
      break;
  }

  return baseControl;
}

// Helper para crear una acción vacía
export function createDefaultAction(type: ActionType): ActionConfig {
  return {
    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    name: ACTION_TYPES_INFO[type].label,
    enabled: true,
    order: 0
  };
}
