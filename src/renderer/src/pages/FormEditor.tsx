import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';
import Swal from 'sweetalert2';
import '../styles/sweetalert-custom.css';
import './FormEditor.css';
import ControlCreatorModal from '../components/ControlCreatorModal';
import { CustomControl } from '../types/CustomControls';

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox' | 'textarea';
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  placeholder?: string;
  required: boolean;
  formatAsNumber?: boolean; // Formato numérico con miles y decimales
  decimals?: number; // Cantidad de decimales (por defecto 2)
  prefix?: string; // Prefijo para el valor (ej: "C$ ", "$", "€")
  suffix?: string; // Sufijo para el valor (ej: " USD", "%", " km")
}

interface TableDefinition {
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
    width: number;
    type: 'text' | 'number' | 'date';
  }>;
  minRows: number;
  maxRows: number;
  rowHeight: number;
  style: any;
}

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  backgroundImage: string;
  fields: FormField[];
  tables?: TableDefinition[];
  pageSize: {
    width: number;
    height: number;
  };
  numerationConfig?: {
    enabled: boolean;
    fieldId: string;
    type: string;
    prefix: string;
    suffix: string;
    padding: number;
    source?: string;
    apiResponseFolioPath?: string;
  };
  apiConfiguration?: {
    enabled: boolean;
    endpoint: string;
    method: string;
  };
  fieldMappings?: Array<{
    fieldId: string;
    apiKey: string;
    required?: boolean;
    includeInApi?: boolean;
  }>;
  customControls?: CustomControl[];
}

const FormEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [tableValues, setTableValues] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  
  // Estados para drag and drop
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggingElement, setDraggingElement] = useState<{ type: 'field' | 'table' | 'cell' | 'custom'; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  
  // Estados para resize
  const [resizingTable, setResizingTable] = useState<{ id: string; direction: 'e' | 's' | 'se'; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  
  // Estado para posiciones de celdas individuales (tableId_colId_rowIdx -> {x, y, width, height})
  const [cellPositions, setCellPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  
  // Estado para notificaciones no bloqueantes
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  
  // Estado para celdas eliminadas (cellId -> boolean)
  const [deletedCells, setDeletedCells] = useState<Record<string, boolean>>({});
  
  // Estado para campos eliminados de IA (fieldId -> boolean)
  const [deletedAIFields, setDeletedAIFields] = useState<Record<string, boolean>>({});
  
  // Estado para campos personalizados agregados manualmente
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  
  // Estado para controlar qué campo está siendo editado
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldName, setEditingFieldName] = useState<string>('');
  
  // Estado para el modal de tabla expandida
  const [expandedTableId, setExpandedTableId] = useState<string | null>(null);
  
  // Estado para controles personalizados avanzados
  const [customControls, setCustomControls] = useState<CustomControl[]>([]);
  const [controlValues, setControlValues] = useState<Record<string, any>>({});
  const [showControlCreator, setShowControlCreator] = useState(false);
  const [editingControl, setEditingControl] = useState<CustomControl | null>(null);
  
  // Estado para configuración de campos personalizados
  const [showFieldConfig, setShowFieldConfig] = useState(false);
  const [editingFieldConfig, setEditingFieldConfig] = useState<FormField | null>(null);
  
  // Estados para selección y movimiento de filas
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set()); // Set de "tableId_rowIndex"
  const [isMovingRows, setIsMovingRows] = useState(false);
  const [rowMoveStart, setRowMoveStart] = useState<{ y: number; rows: string[] } | null>(null);

  // Función para renderizar controles avanzados
  const renderCustomControl = (control: CustomControl, value: any, onChange: (value: any) => void): JSX.Element => {
    const baseStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      fontSize: `${control.style.fontSize || 14}px`,
      fontFamily: control.style.fontFamily || 'Arial',
      color: control.style.color || '#000000',
      backgroundColor: control.style.backgroundColor || 'transparent',
      border: `${control.style.borderWidth || 1}px solid ${control.style.borderColor || '#d1d5db'}`,
      borderRadius: `${control.style.borderRadius || 4}px`,
      padding: '4px 8px',
      boxSizing: 'border-box' as const
    };

    switch (control.type) {
      case 'select':
        return (
          <select
            style={{ ...baseStyle, cursor: 'pointer' }}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={control.disabled}
          >
            <option value="">{control.config.placeholder || 'Seleccionar...'}</option>
            {control.config.options?.map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'button':
        const buttonColors: Record<string, string> = {
          primary: '#3b82f6',
          secondary: '#6b7280',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444'
        };
        return (
          <button
            style={{
              ...baseStyle,
              backgroundColor: buttonColors[control.config.buttonStyle || 'primary'],
              color: 'white',
              border: 'none',
              cursor: control.disabled ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            disabled={control.disabled}
            onClick={() => {
              // Ejecutar acciones onClick
              if (control.actions.onClick?.length) {
                executeActions(control.actions.onClick);
              }
            }}
          >
            {control.config.buttonIcon} {control.config.buttonText || 'Botón'}
          </button>
        );

      case 'radio':
        return (
          <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column', gap: '6px', border: 'none', padding: 0 }}>
            {control.config.options?.map((opt, i) => (
              <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={control.id}
                  value={opt.value}
                  checked={value === opt.value}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={control.disabled}
                />
                {opt.label}
              </label>
            ))}
          </div>
        );

      case 'calculated':
        // Estilos según displayStyle
        const displayStyle = control.config.displayStyle || 'input';
        const calculatedStyles: Record<string, React.CSSProperties> = {
          'input': { 
            backgroundColor: '#f3f4f6', 
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            padding: '4px 8px'
          },
          'transparent': { 
            backgroundColor: 'transparent', 
            border: 'none',
            padding: '2px 4px'
          },
          'underline': { 
            backgroundColor: 'transparent', 
            border: 'none',
            borderBottom: '1px solid #000',
            borderRadius: '0',
            padding: '2px 4px'
          },
          'bordered': { 
            backgroundColor: 'transparent', 
            border: '1px solid #000',
            borderRadius: '0',
            padding: '2px 4px'
          },
          'label': { 
            backgroundColor: 'transparent', 
            border: 'none',
            padding: '0'
          },
          'badge': { 
            backgroundColor: '#3b82f6', 
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '4px 12px',
            fontWeight: '600'
          }
        };
        
        // Renderizar valor calculado con formato de miles y decimales
        const numericValue = parseFloat(value || '0');
        const isZero = numericValue === 0;
        const decimals = control.config.decimalPlaces ?? 2; // Por defecto 2 decimales
        const formattedValue = formatNumberWithThousands(value, decimals);
        
        const calculatedValueElement = (
          <div style={{ 
            ...calculatedStyles[displayStyle],
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '2px',
            whiteSpace: 'nowrap',
            opacity: isZero ? 0.5 : 1, // Más transparente si es 0
            // Aplicar estilos personalizados del control
            color: control.style?.color || (calculatedStyles[displayStyle]?.color as string),
            fontSize: control.style?.fontSize ? `${control.style.fontSize}px` : undefined,
            fontFamily: control.style?.fontFamily || undefined,
            backgroundColor: control.style?.backgroundColor || (calculatedStyles[displayStyle]?.backgroundColor as string),
            borderColor: control.style?.borderColor || (calculatedStyles[displayStyle]?.borderColor as string),
            borderWidth: control.style?.borderWidth ? `${control.style.borderWidth}px` : undefined,
            borderRadius: control.style?.borderRadius ? `${control.style.borderRadius}px` : undefined
          }}>
            {control.config.prefix && <span>{control.config.prefix}</span>}
            <span style={{ 
              fontVariantNumeric: 'normal',
              letterSpacing: 'normal',
              fontWeight: displayStyle === 'badge' ? '600' : '500'
            }}>
              {formattedValue}
            </span>
            {control.config.suffix && <span>{control.config.suffix}</span>}
          </div>
        );
        
        // Si tiene label, renderizar con el label
        if (control.config.showLabel && control.config.labelText) {
          const labelElement = (
            <div style={{ 
              color: control.style?.color || '#374151',
              fontSize: `${(control.style?.fontSize || 12) - 1}px`,
              fontWeight: '500',
              whiteSpace: 'nowrap'
            }}>
              {control.config.labelText}
            </div>
          );
          
          const labelPosition = control.config.labelPosition || 'left';
          
          return (
            <div style={{ 
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexDirection: labelPosition === 'top' ? 'column' : 'row',
              justifyContent: labelPosition === 'right' ? 'space-between' : 'flex-start',
              border: 'none',
              padding: 0
            }}>
              {labelPosition === 'left' && labelElement}
              {labelPosition === 'top' && <div style={{ width: '100%' }}>{labelElement}</div>}
              {calculatedValueElement}
              {labelPosition === 'right' && labelElement}
            </div>
          );
        }
        
        // Sin label, solo el valor formateado
        return calculatedValueElement;

      case 'label':
        const labelStyles: Record<string, React.CSSProperties> = {
          heading: { fontSize: '1.5rem', fontWeight: '700' },
          subheading: { fontSize: '1.2rem', fontWeight: '600' },
          body: { fontSize: '1rem' },
          caption: { fontSize: '0.85rem', color: '#6b7280' }
        };
        return (
          <div style={{ ...baseStyle, border: 'none', ...labelStyles[control.config.labelStyle || 'body'] }}>
            {control.config.labelText || 'Etiqueta'}
          </div>
        );

      case 'switch':
        const isOn = value === true;
        return (
          <label style={{ ...baseStyle, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}>
            <div
              onClick={() => onChange(!isOn)}
              style={{
                width: '44px',
                height: '24px',
                backgroundColor: isOn ? '#10b981' : '#d1d5db',
                borderRadius: '12px',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              <div style={{
                width: '20px',
                height: '20px',
                backgroundColor: 'white',
                borderRadius: '50%',
                position: 'absolute',
                top: '2px',
                left: isOn ? '22px' : '2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s'
              }} />
            </div>
            <span>{isOn ? (control.config.onLabel || 'Sí') : (control.config.offLabel || 'No')}</span>
          </label>
        );

      case 'slider':
        return (
          <div style={{ ...baseStyle, display: 'flex', flexDirection: 'column', gap: '4px', border: 'none' }}>
            <input
              type="range"
              min={control.config.min || 0}
              max={control.config.max || 100}
              step={control.config.step || 1}
              value={value || control.config.min || 0}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              style={{ width: '100%' }}
              disabled={control.disabled}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
              <span>{control.config.min || 0}</span>
              <span style={{ fontWeight: '600' }}>{value || control.config.min || 0}</span>
              <span>{control.config.max || 100}</span>
            </div>
          </div>
        );

      case 'file':
        return (
          <div
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#f9fafb',
              cursor: 'pointer'
            }}
            onClick={() => {
              // Aquí se puede implementar la lógica de selección de archivo
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = control.config.acceptedTypes?.map(t => `.${t}`).join(',') || '*';
              input.multiple = control.config.multiple || false;
              input.onchange = (e) => {
                const files = (e.target as HTMLInputElement).files;
                if (files) {
                  onChange(Array.from(files));
                }
              };
              input.click();
            }}
          >
            📎 <span style={{ color: '#6b7280' }}>{value?.length ? `${value.length} archivo(s)` : 'Seleccionar archivo...'}</span>
          </div>
        );

      case 'signature':
        return (
          <div
            style={{
              ...baseStyle,
              backgroundColor: control.config.backgroundColor || '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60px',
              color: '#9ca3af',
              fontStyle: 'italic',
              cursor: 'crosshair'
            }}
          >
            {value ? '✓ Firmado' : '✍️ Firma aquí'}
          </div>
        );

      case 'date-range':
        const dateValue = value || { start: '', end: '' };
        return (
          <div style={{ ...baseStyle, display: 'flex', alignItems: 'center', gap: '8px', border: 'none', padding: 0 }}>
            <input
              type="date"
              value={dateValue.start || ''}
              onChange={(e) => onChange({ ...dateValue, start: e.target.value })}
              style={{ flex: 1, padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              disabled={control.disabled}
            />
            <span>→</span>
            <input
              type="date"
              value={dateValue.end || ''}
              onChange={(e) => onChange({ ...dateValue, end: e.target.value })}
              style={{ flex: 1, padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              disabled={control.disabled}
            />
          </div>
        );

      case 'time':
        return (
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            style={baseStyle}
            disabled={control.disabled}
          />
        );

      case 'color':
        return (
          <input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...baseStyle, padding: '2px', cursor: 'pointer' }}
            disabled={control.disabled}
          />
        );

      case 'checkbox':
        return (
          <label style={{ 
            ...baseStyle,
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            cursor: control.disabled ? 'not-allowed' : 'pointer',
            userSelect: 'none'
          }}>
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => onChange(e.target.checked)}
              disabled={control.disabled}
              style={{
                width: '18px',
                height: '18px',
                cursor: control.disabled ? 'not-allowed' : 'pointer'
              }}
            />
            <span style={{ 
              fontSize: control.style?.fontSize ? `${control.style.fontSize}px` : '14px',
              color: control.style?.color || '#374151',
              fontFamily: control.style?.fontFamily || 'inherit'
            }}>
              {control.config.checkboxLabel || control.name}
            </span>
          </label>
        );

      default:
        return <div style={baseStyle}>Control: {control.type}</div>;
    }
  };

  // Función para ejecutar acciones
  const executeActions = async (actions: any[]) => {
    for (const action of actions) {
      if (!action.enabled) continue;
      
      try {
        switch (action.type) {
          case 'show-message':
            await Swal.fire({
              icon: action.showMessageConfig?.type || 'info',
              title: action.showMessageConfig?.title || 'Mensaje',
              text: action.showMessageConfig?.message || '',
            });
            break;
          
          case 'api-call':
            if (action.apiConfig?.url) {
              // Construir mapa de todos los valores disponibles por nombre
              const allValuesByName: Record<string, string> = {};
              
              // Campos IA
              template?.fields?.forEach(f => {
                allValuesByName[f.name] = fieldValues[f.id] || '';
              });
              
              // Campos personalizados
              customFields.forEach(f => {
                allValuesByName[f.name] = fieldValues[f.id] || '';
              });
              
              // Controles avanzados (todos los tipos de entrada)
              customControls.forEach(c => {
                // Excluir botones y etiquetas que no generan datos
                if (c.type === 'button' || c.type === 'label') return;
                
                const value = controlValues[c.id];
                
                // Manejar diferentes tipos de valores
                if (c.type === 'file' && value) {
                  // Para archivos, enviar nombre o base64 si está disponible
                  allValuesByName[c.name] = typeof value === 'object' ? (value.name || value.base64 || JSON.stringify(value)) : String(value);
                } else if (c.type === 'signature' && value) {
                  // Para firma, enviar el base64 de la imagen
                  allValuesByName[c.name] = String(value);
                } else if (c.type === 'calculated') {
                  // Para campos calculados, obtener el valor calculado actual
                  allValuesByName[c.name] = String(value || '0');
                } else if (c.type === 'toggle') {
                  // Para toggles, convertir a string "true" o "false"
                  allValuesByName[c.name] = String(!!value);
                } else {
                  // Para el resto (select, radio, date-picker, etc.)
                  allValuesByName[c.name] = String(value || '');
                }
              });
              
              // Folio del sistema (si está configurado)
              if (template?.numerationConfig?.enabled && template?.numerationConfig?.fieldId) {
                const folioValue = fieldValues[template.numerationConfig.fieldId] || '';
                allValuesByName['Número de Folio'] = folioValue;
              }
              
              // Usuario autenticado
              allValuesByName['Usuario ID'] = user.id || '';
              allValuesByName['Usuario Email'] = user.email || '';
              allValuesByName['Usuario Nombre'] = user.name || user.email || '';
              
              // Reemplazar placeholders en la URL y body
              let url = action.apiConfig.url;
              let body = action.apiConfig.bodyTemplate || '';
              
              // Buscar campos usados en la URL para validación
              const urlFieldsRegex = /\{([^}]+)\}/g;
              const usedFieldsInUrl: string[] = [];
              let match;
              while ((match = urlFieldsRegex.exec(action.apiConfig.url)) !== null) {
                usedFieldsInUrl.push(match[1]);
              }
              
              // Validar que los campos tengan valor (si está activada la validación)
              if (action.apiConfig.validateBeforeCall !== false) {
                const emptyFields = usedFieldsInUrl.filter(fieldName => !allValuesByName[fieldName]);
                if (emptyFields.length > 0) {
                  await Swal.fire({
                    icon: 'warning',
                    title: 'Campos vacíos',
                    html: `Los siguientes campos están vacíos y son requeridos para la API:<br><br><strong>${emptyFields.join(', ')}</strong>`,
                  });
                  return; // Detener ejecución
                }
              }
              
              // Reemplazar {campo} con valores reales
              Object.entries(allValuesByName).forEach(([name, value]) => {
                const regex = new RegExp(`\\{${name}\\}`, 'g');
                url = url.replace(regex, encodeURIComponent(String(value)));
                body = body.replace(regex, String(value));
              });
              
              console.log('🌐 API Call:', { url, method: action.apiConfig.method, body });
              
              // Construir headers
              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
              };
              
              // Agregar headers personalizados
              action.apiConfig.customHeaders?.forEach((h: { key: string; value: string }) => {
                if (h.key && h.value) {
                  headers[h.key] = h.value;
                }
              });
              
              // Agregar autenticación
              if (action.apiConfig.authType === 'bearer' && action.apiConfig.bearerToken) {
                headers['Authorization'] = `Bearer ${action.apiConfig.bearerToken}`;
              } else if (action.apiConfig.authType === 'apikey' && action.apiConfig.apiKeyValue) {
                headers[action.apiConfig.apiKeyHeader || 'X-API-Key'] = action.apiConfig.apiKeyValue;
              } else if (action.apiConfig.authType === 'basic' && action.apiConfig.basicUsername) {
                const basicAuth = btoa(`${action.apiConfig.basicUsername}:${action.apiConfig.basicPassword || ''}`);
                headers['Authorization'] = `Basic ${basicAuth}`;
              }
              
              // Configurar timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), action.apiConfig.timeout || 30000);
              
              try {
                const response = await fetch(url, {
                  method: action.apiConfig.method || 'GET',
                  headers,
                  body: ['POST', 'PUT', 'PATCH'].includes(action.apiConfig.method || 'GET') ? body : undefined,
                  signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // Intentar parsear la respuesta como JSON
                let data = null;
                const contentType = response.headers.get('content-type');
                const responseText = await response.text();
                
                if (responseText && responseText.trim()) {
                  try {
                    // Intentar parsear como JSON
                    data = JSON.parse(responseText);
                    console.log('🌐 API Response (JSON):', data);
                  } catch {
                    // Si no es JSON, usar el texto como respuesta
                    console.log('🌐 API Response (Text):', responseText);
                    data = { response: responseText };
                  }
                } else {
                  // Respuesta vacía (común en DELETE o 204 No Content)
                  console.log('🌐 API Response: Empty (status ' + response.status + ')');
                  data = { success: true, status: response.status };
                }
                
                // Mapear respuesta a campos si está configurado y hay datos
                if (data && action.apiConfig.responseMapping?.length) {
                  action.apiConfig.responseMapping.forEach((mapping: any) => {
                    const value = mapping.jsonPath.split('.').reduce((obj: any, key: string) => obj?.[key], data);
                    if (value !== undefined) {
                      // Buscar el campo por ID y actualizar su valor
                      setFieldValues(prev => ({ ...prev, [mapping.targetFieldId]: String(value) }));
                      setControlValues(prev => ({ ...prev, [mapping.targetFieldId]: String(value) }));
                    }
                  });
                }
                
                setNotification({ message: '✅ API ejecutada correctamente', type: 'success' });
              } catch (err: any) {
                if (err.name === 'AbortError') {
                  setNotification({ message: '⏱️ Timeout: La API no respondió a tiempo', type: 'error' });
                } else {
                  setNotification({ message: `❌ Error API: ${err.message}`, type: 'error' });
                }
                console.error('Error en API call:', err);
              }
            }
            break;
          
          case 'set-value':
            if (action.setValueConfig?.targetFieldId) {
              let newValue = action.setValueConfig.value;
              
              if (action.setValueConfig.valueType === 'formula') {
                // Evaluar fórmula simple
                newValue = evaluateFormula(action.setValueConfig.value);
              }
              
              setFieldValues(prev => ({ ...prev, [action.setValueConfig.targetFieldId]: newValue }));
            }
            break;
          
          case 'print':
            handlePrint();
            break;
          
          case 'open-url':
            if (action.openUrlConfig?.url) {
              window.open(action.openUrlConfig.url, '_blank');
            }
            break;
          
          case 'copy':
            if (action.copyConfig?.sourceFieldId) {
              const valueToCopy = fieldValues[action.copyConfig.sourceFieldId] || controlValues[action.copyConfig.sourceFieldId] || '';
              await navigator.clipboard.writeText(String(valueToCopy));
              setNotification({ message: '📋 Copiado al portapapeles', type: 'success' });
            }
            break;
          
          case 'calculate':
            if (action.calculateConfig?.formula && action.calculateConfig?.targetFieldId) {
              const result = evaluateFormula(action.calculateConfig.formula);
              setFieldValues(prev => ({ ...prev, [action.calculateConfig.targetFieldId]: result }));
            }
            break;
          
          case 'show-hide':
            if (action.showHideConfig?.targetFieldId) {
              const fieldId = action.showHideConfig.targetFieldId;
              const controlIdx = customControls.findIndex(c => c.id === fieldId);
              if (controlIdx !== -1) {
                setCustomControls(prev => {
                  const updated = [...prev];
                  if (action.showHideConfig.action === 'show') {
                    updated[controlIdx] = { ...updated[controlIdx], visible: true };
                  } else if (action.showHideConfig.action === 'hide') {
                    updated[controlIdx] = { ...updated[controlIdx], visible: false };
                  } else {
                    updated[controlIdx] = { ...updated[controlIdx], visible: !updated[controlIdx].visible };
                  }
                  return updated;
                });
              }
            }
            break;
          
          case 'validate':
            // Validar todos los campos requeridos
            const requiredFields = (template?.fields || []).filter((f: any) => f.required);
            const emptyRequiredFields = requiredFields.filter((f: any) => !fieldValues[f.id]);
            
            if (emptyRequiredFields.length > 0) {
              await Swal.fire({
                icon: 'warning',
                title: 'Campos requeridos',
                text: action.validateConfig?.errorMessage || 'Por favor complete todos los campos requeridos',
              });
              if (action.validateConfig?.stopOnError) {
                return; // Detener ejecución de más acciones
              }
            }
            break;
          
          case 'navigate':
            if (action.navigateConfig?.target === 'dashboard') {
              navigate('/dashboard');
            } else if (action.navigateConfig?.target === 'back') {
              navigate(-1);
            } else if (action.navigateConfig?.target === 'custom' && action.navigateConfig?.customPath) {
              navigate(action.navigateConfig.customPath);
            }
            break;
          
          case 'clear-form':
            // Limpiar todos los valores
            setFieldValues({});
            setControlValues({});
            setTableValues({});
            setNotification({ message: '🗑️ Formulario limpiado', type: 'info' });
            break;
          
          case 'submit-form':
            // Guardar el formulario automáticamente
            await handleSave();
            setNotification({ message: '📤 Formulario guardado', type: 'success' });
            break;
        }
      } catch (error) {
        setNotification({ message: `Error en acción: ${action.name}`, type: 'error' });
      }
    }
  };

  // Función auxiliar para limpiar y parsear valores numéricos
  const cleanAndParseNumber = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    
    // Convertir a string si no lo es
    let strValue = String(value).trim();
    
    // Si es un placeholder/texto común, devolver 0
    const placeholders = ['escribe aquí', 'escriba aquí', 'ingrese', 'placeholder', 'n/a', 'na', '-'];
    if (placeholders.some(ph => strValue.toLowerCase().includes(ph))) {
      return 0;
    }
    
    // Limpiar símbolos de moneda, espacios, comas y otros caracteres no numéricos
    // Primero eliminar secuencias comunes de moneda
    strValue = strValue.replace(/C\$/g, '');  // C$
    strValue = strValue.replace(/[$€£¥₹]/g, ''); // Otros símbolos de moneda
    strValue = strValue.replace(/[,\s]/g, '');    // Comas y espacios
    strValue = strValue.replace(/[^\d.-]/g, '');  // Todo excepto dígitos, punto decimal y signo negativo
    
    // Parsear el número
    const parsed = parseFloat(strValue);
    
    if (isNaN(parsed)) {
      return 0;
    }
    
    return parsed;
  };

  // Función auxiliar para formatear números con separadores de miles y decimales
  const formatNumberWithThousands = (value: any, decimals: number = 2): string => {
    const num = cleanAndParseNumber(value);
    
    // Si es 0, retornar con formato de decimales
    if (num === 0) {
      return '0.' + '0'.repeat(decimals);
    }
    
    // Formatear con separadores de miles y decimales
    const parts = num.toFixed(decimals).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    return parts.join('.');
  };

  // Función para evaluar fórmulas simples (incluye funciones de tabla)
  const evaluateFormula = (formula: string): string => {
    try {
      let expression = formula;
      const allValues = { ...fieldValues, ...controlValues };
      let hasInvalidValues = false; // Flag para detectar valores vacíos/negativos
      
      // Primero, procesar funciones de tabla: SUM(tableId.columnName), COUNT(...), AVG(...), MIN(...), MAX(...)
      const tableFuncRegex = /(SUM|COUNT|AVG|MIN|MAX)\(([^.]+)\.([^)]+)\)/gi;
      expression = expression.replace(tableFuncRegex, (match, func, tableId, columnName) => {
       
        // Buscar la tabla
        const table = template?.tables?.find(t => t.id === tableId);
        if (!table) {
          return '0';
        }
        
        // Buscar la columna (buscar por header o por id, ignorando mayúsculas/minúsculas)
        const column = table.columns.find(c => 
          c.header.toLowerCase() === columnName.toLowerCase() || 
          c.id.toLowerCase() === columnName.toLowerCase()
        );
        if (!column) {        
          return '0';
        }
        
        // Obtener todos los valores de esa columna
        const rows = tableValues[tableId] || [];
        
        const values = rows
          .map((row: Record<string, any>) => {
            const val = row[column.id];
            const cleaned = cleanAndParseNumber(val);
            console.log(`  Fila valor para ${column.id}:`, val, '→', cleaned);
            return cleaned;
          })
          .filter((v: number) => !isNaN(v));
        
        
        if (values.length === 0) {
          return '0';
        }
        
        // Aplicar la función
        switch (func.toUpperCase()) {
          case 'SUM':
            return values.reduce((a: number, b: number) => a + b, 0).toString();
          case 'COUNT':
            return values.length.toString();
          case 'AVG':
            return (values.reduce((a: number, b: number) => a + b, 0) / values.length).toString();
          case 'MIN':
            return Math.min(...values).toString();
          case 'MAX':
            return Math.max(...values).toString();
          default:
            return '0';
        }
      });
      
      // Luego, reemplazar {campo} con valores numéricos
      const regex = /\{([^}]+)\}/g;
      expression = expression.replace(regex, (match, fieldName) => {
        // PRIORIDAD 1: Buscar en columnas de tabla PRIMERO (para evitar conflictos con controles)
        for (const table of template?.tables || []) {
          const column = table.columns.find(c => 
            c.header === fieldName || // Exacto primero
            c.id === fieldName ||
            c.header.toLowerCase() === fieldName.toLowerCase() || // Case-insensitive después
            c.id.toLowerCase() === fieldName.toLowerCase()
          );
          
          if (column) {
            const rows = tableValues[table.id] || [];
            console.log(`🔍 Buscando columna "${column.header}" (${column.id}) en tabla ${table.id}`);
            console.log(`   Filas disponibles:`, rows.length);
            
            if (rows.length > 0) {
              // Debug: Mostrar valores de cada celda
              rows.forEach((row, idx) => {
                const rawValue = row[column.id];
                console.log(`   Fila ${idx}: "${rawValue}" (tipo: ${typeof rawValue}, vacío: ${rawValue === '' || rawValue === null || rawValue === undefined})`);
              });
              
              // Verificar si TODAS las celdas están vacías
              const allEmpty = rows.every((row: Record<string, any>) => {
                const rawValue = row[column.id];
                const isEmpty = rawValue === null || rawValue === undefined || rawValue === '' || 
                       String(rawValue).trim() === '' || String(rawValue).toLowerCase().includes('escribe');
                return isEmpty;
              });
              
              console.log(`   ¿Todas vacías?: ${allEmpty}`);
              
              // Si todas las celdas están vacías, marcar como inválido inmediatamente
              if (allEmpty) {
                hasInvalidValues = true;
                console.log(`✅ Columna de tabla "${column.header}": Todas las celdas vacías → inválido`);
                return '0';
              }
              
              // Si hay múltiples filas, sumar los valores (comportamiento por defecto)
              const values = rows.map((row: Record<string, any>) => {
                const rawValue = row[column.id];
                return cleanAndParseNumber(rawValue);
              });
              const sum = values.reduce((a, b) => a + b, 0);
              
              console.log(`   📊 Suma total: ${sum}`);
              console.log(`   📊 Valores parseados:`, values);
              
              if (rows.length > 1) {
                console.log(`🔍 Columna de tabla "${column.header}" (${rows.length} filas):`, sum);
              } else {
                console.log(`🔍 Columna de tabla "${column.header}":`, rows[0][column.id], '→', sum);
              }
              
              return sum.toString();
            } else {
              hasInvalidValues = true;
              console.log(`🔍 Columna de tabla "${column.header}": Sin filas → inválido`);
              return '0';
            }
          }
        }
        
        // PRIORIDAD 2: Buscar en campos IA (exacto primero, luego case-insensitive)
        let aiField = template?.fields?.find(f => f.name === fieldName);
        if (!aiField) {
          aiField = template?.fields?.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
        }
        if (aiField) {
          const value = allValues[aiField.id];
          const cleaned = cleanAndParseNumber(value);
          
          // NO marcar como inválido aquí, validaremos el resultado final
          
          console.log(`🔍 Campo IA "${aiField.name}":`, value, '→', cleaned);
          return cleaned.toString();
        }
        
        // PRIORIDAD 3: Buscar en campos personalizados (exacto primero, luego case-insensitive)
        let customField = customFields.find(f => f.name === fieldName);
        if (!customField) {
          customField = customFields.find(f => f.name.toLowerCase() === fieldName.toLowerCase());
        }
        if (customField) {
          const value = allValues[customField.id];
          const cleaned = cleanAndParseNumber(value);
          
          // NO marcar como inválido aquí, validaremos el resultado final
          
          console.log(`🔍 Campo Custom "${customField.name}":`, value, '→', cleaned);
          return cleaned.toString();
        }
        
        // PRIORIDAD 4: Buscar en controles avanzados (exacto primero, luego case-insensitive)
        let control = customControls.find(c => c.name === fieldName);
        if (!control) {
          control = customControls.find(c => c.name.toLowerCase() === fieldName.toLowerCase());
        }
        if (control) {
          const value = controlValues[control.id];
          
          // Si es checkbox o toggle, convertir a 1 o 0 para fórmulas
          if (control.type === 'checkbox' || control.type === 'toggle') {
            const boolValue = value === true || value === 'true' || value === 1 || value === '1';
            console.log(`🔍 Checkbox/Toggle "${control.name}":`, value, '→', boolValue ? 1 : 0);
            return boolValue ? '1' : '0';
          }
          
          const cleaned = cleanAndParseNumber(value);
          
          // NO marcar como inválido aquí, validaremos el resultado final
          
          console.log(`🔍 Control Avanzado "${control.name}":`, value, '→', cleaned);
          return cleaned.toString();
        }
        
        // No se encontró el campo
        hasInvalidValues = true;
        console.error(`❌ Campo no encontrado: "${fieldName}"`);
        console.log('📋 Campos disponibles:', [
          ...template?.tables?.flatMap(t => t.columns.map(c => `${c.header} (tabla)`)) || [],
          ...template?.fields?.map(f => `${f.name} (IA)`) || [],
          ...customFields.map(f => `${f.name} (custom)`),
          ...customControls.map(c => `${c.name} (control)`)
        ]);
        return '0';
      });
      
      console.log(`📊 Estado de hasInvalidValues: ${hasInvalidValues}`);
      
      // Evaluar expresión matemática de forma segura
      console.log('🧮 Expresión final a evaluar:', expression);
      const result = Function(`"use strict"; return (${expression})`)();
      console.log('✅ Resultado del cálculo:', result, '→ Formateado:', result.toFixed(2));
      
      // Si hay valores inválidos (todas las columnas vacías) O el resultado es <= 0, retornar 0
      if (hasInvalidValues && result <= 0) {
        console.log('⚠️ Columnas vacías Y resultado <= 0 → Retornar 0.00');
        return '0.00';
      }
      
      // Si el resultado es válido pero negativo, mostrar 0
      if (result < 0) {
        console.log('⚠️ Resultado negativo → Retornar 0.00');
        return '0.00';
      }
      
      return isNaN(result) ? '0.00' : result.toFixed(2);
    } catch (err) {
      console.error('❌ Error evaluando fórmula:', err);
      console.error('   Fórmula original:', formula);
      return '0.00';
    }
  };

  useEffect(() => {
    loadTemplate();
  }, [id]);

  // ⭐ ACTUALIZADO: Cargar vista previa del folio cuando se carga el template
  useEffect(() => {
    const loadFolioPreview = async () => {
      if (!template || !template.numerationConfig?.enabled || !template.numerationConfig.fieldId) {
        return;
      }

      const config = template.numerationConfig;
      
      // Si es api-response, no cargar preview (se genera al imprimir)
      if (config.source === 'api-response') {
        setFieldValues(prev => ({
          ...prev,
          [config.fieldId]: '(se generará al imprimir)'
        }));
        return;
      }
      
      let previewResult;
      
      // Determinar el origen del folio
      if (config.source === 'api') {
        previewResult = await window.electronAPI.getFolioFromExternalApi(template.id);
      } else {
        previewResult = await window.electronAPI.previewNextFolio(template.id);
      }
      
      if (previewResult.success && previewResult.formNumber) {
        setFieldValues(prev => ({
          ...prev,
          [config.fieldId]: previewResult.formNumber
        }));
      }
    };

    loadFolioPreview();
  }, [template?.id, template?.numerationConfig?.enabled]);

  // ⭐ NUEVO: Recalcular campos calculados cuando cambien valores
  useEffect(() => {
    console.log('🔄 useEffect: Recalculando campos calculados...');
    console.log('   tableValues:', tableValues);
    
    if (!customControls.length) return;
    
    // Buscar todos los controles de tipo 'calculated'
    const calculatedControls = customControls.filter(c => c.type === 'calculated');
    if (!calculatedControls.length) return;
    
    console.log(`   Controles calculados encontrados: ${calculatedControls.length}`);
    
    // Recalcular cada uno
    const newControlValues: Record<string, string> = {};
    let hasChanges = false;
    
    calculatedControls.forEach(control => {
      if (control.config.formula) {
        console.log(`   📐 Evaluando "${control.name}": ${control.config.formula}`);
        const result = evaluateFormula(control.config.formula);
        console.log(`   ✅ Resultado: "${result}"`);
        
        // Guardar el valor sin formato (el renderizado aplicará formato + prefijo + sufijo)
        if (controlValues[control.id] !== result) {
          console.log(`   🔄 Cambio detectado: "${controlValues[control.id]}" → "${result}"`);
          newControlValues[control.id] = result;
          hasChanges = true;
        }
      }
    });
    
    if (hasChanges) {
      console.log('   💾 Actualizando controlValues con:', newControlValues);
      setControlValues(prev => ({ ...prev, ...newControlValues }));
    } else {
      console.log('   ℹ️ No hay cambios en campos calculados');
    }
  }, [tableValues, fieldValues, customControls]);

  // Protección adicional: forzar que los inputs del sidebar SIEMPRE estén habilitados
  useEffect(() => {
    const enableSidebarInputs = () => {
      const sidebar = document.querySelector('.editor-sidebar');
      if (sidebar) {
        const inputs = sidebar.querySelectorAll('input, textarea, select');
        inputs.forEach((input: any) => {
          if (input.disabled) {
            input.disabled = false;
          }
          if (input.readOnly) {
            input.readOnly = false;
          }
        });
      }
    };

    // Ejecutar inmediatamente
    enableSidebarInputs();

    // Ejecutar después de cada cambio de estado (solo si no está guardando)
    if (!saving) {
      const interval = setInterval(enableSidebarInputs, 100);
      return () => clearInterval(interval);
    }
  }, [saving, printing, isDragMode]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 2)); // Máximo 200%
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.3)); // Mínimo 30%
  };

  const handleResetZoom = () => {
    setScale(0.8); // Zoom por defecto
  };

  const loadTemplate = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const result = await window.electronAPI.getFormTemplateById(id);
      if (result.success) {
        // 🔍 DEBUG: Verificar configuración de numeración al cargar
        console.log('🔍 [FormEditor] Template cargado:', result.template);
        console.log('🔍 [FormEditor] Configuración de numeración:', result.template.numerationConfig);
        if (result.template.numerationConfig) {
          console.log('   - enabled:', result.template.numerationConfig.enabled);
          console.log('   - fieldId:', result.template.numerationConfig.fieldId);
          console.log('   - source:', result.template.numerationConfig.source);
        }
        
        // Separar campos originales de campos personalizados
        const allFields = result.template.fields || [];
        const originalFields: FormField[] = [];
        const personalizedFields: FormField[] = [];
        
        allFields.forEach((field: FormField) => {
          // Los campos personalizados tienen IDs que empiezan con 'custom_field_'
          if (field.id.startsWith('custom_field_')) {
            personalizedFields.push(field);
          } else {
            originalFields.push(field);
          }
        });
        
        // Actualizar el template solo con los campos originales
        setTemplate({
          ...result.template,
          fields: originalFields
        });
        
        // Cargar los campos personalizados en el estado separado
        setCustomFields(personalizedFields);
        
        // Cargar controles avanzados si existen
        if (result.template.customControls && Array.isArray(result.template.customControls)) {
          setCustomControls(result.template.customControls);
          
          // Inicializar valores de los controles con valores por defecto
          const initialControlValues: Record<string, any> = {};
          result.template.customControls.forEach((control: any) => {
            // Inicializar checkboxes y toggles con su valor por defecto
            if (control.type === 'checkbox') {
              initialControlValues[control.id] = control.config.checkboxDefaultValue || false;
            } else if (control.type === 'toggle') {
              initialControlValues[control.id] = false;
            } else {
              initialControlValues[control.id] = '';
            }
          });
          setControlValues(initialControlValues);
        }
        
        // Inicializar valores de TODOS los campos (originales + personalizados)
        const initialValues: Record<string, any> = {};
        allFields.forEach((field: FormField) => {
          initialValues[field.id] = field.type === 'checkbox' ? false : '';
        });
        setFieldValues(initialValues);

        // Inicializar valores de tablas
        const initialTableValues: Record<string, any[]> = {};
        const initialCellPositions: Record<string, { x: number; y: number; width: number; height: number }> = {};
        
        result.template.tables?.forEach((table: TableDefinition) => {
          // Usar las filas guardadas si existen, si no, crear filas vacías basadas en minRows
          const savedRows = (table as any).savedRows;
          let rows: any[] = [];
          
          if (savedRows && Array.isArray(savedRows) && savedRows.length > 0) {
            // Usar las filas guardadas
            rows = savedRows;
          } else {
            // Crear filas vacías basadas en minRows (solo si no hay guardadas)
            for (let i = 0; i < table.minRows; i++) {
              const row: Record<string, string> = {};
              table.columns.forEach(col => {
                row[col.id] = '';
              });
              rows.push(row);
            }
          }
          initialTableValues[table.id] = rows;
          
          // Inicializar posiciones de celdas (si existen guardadas, si no, calcular basándose en la tabla)
          table.columns.forEach((col, colIdx) => {
            for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
              const cellId = `${table.id}_${col.id}_row${rowIdx}`;
              const cellWidth = col.width || 100;
              const cellHeight = table.rowHeight || 30;
              const xOffset = table.columns.slice(0, colIdx).reduce((acc, c) => acc + (c.width || 100), 0);
              const yOffset = rowIdx * cellHeight;
              
              // Si hay posiciones guardadas en la tabla (customCellPositions), usarlas
              const savedPosition = (table as any).customCellPositions?.[cellId];
              
              initialCellPositions[cellId] = savedPosition || {
                x: table.position.x + xOffset,
                y: table.position.y + yOffset,
                width: cellWidth,
                height: cellHeight
              };
            }
          });
        });
        
        setTableValues(initialTableValues);
        setCellPositions(initialCellPositions);
        
        // Cargar celdas eliminadas desde las tablas
        const loadedDeletedCells: Record<string, boolean> = {};
        result.template.tables?.forEach((table: any) => {
          if (table.deletedCells) {
            Object.assign(loadedDeletedCells, table.deletedCells);
          }
        });
        setDeletedCells(loadedDeletedCells);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleTableCellChange = (tableId: string, rowIndex: number, columnId: string, value: string) => {
    setTableValues((prev) => {
      const newTableValues = { ...prev };
      const rows = [...(newTableValues[tableId] || [])];
      if (rows[rowIndex]) {
        rows[rowIndex] = { ...rows[rowIndex], [columnId]: value };
      }
      newTableValues[tableId] = rows;
      return newTableValues;
    });
  };

  const handleAddRow = (tableId: string) => {
    const table = template?.tables?.find(t => t.id === tableId);
    if (!table) return;
    
    // Agregar nueva fila a los valores
    setTableValues((prev) => {
      const newTableValues = { ...prev };
      const rows = [...(newTableValues[tableId] || [])];
      
      // Crear nueva fila vacía
      const newRow: Record<string, string> = {};
      table.columns.forEach(col => {
        newRow[col.id] = '';
      });
      
      rows.push(newRow);
      newTableValues[tableId] = rows;
      return newTableValues;
    });
    
    // Agregar posiciones para las nuevas celdas
    setCellPositions((prev) => {
      const newPositions = { ...prev };
      const currentRowCount = tableValues[tableId]?.length || 0;
      const newRowIdx = currentRowCount;
      
      table.columns.forEach((col, colIdx) => {
        const cellId = `${tableId}_${col.id}_row${newRowIdx}`;
        const cellWidth = col.width || 100;
        const cellHeight = table.rowHeight || 30;
        const xOffset = table.columns.slice(0, colIdx).reduce((acc, c) => acc + (c.width || 100), 0);
        const yOffset = newRowIdx * cellHeight;
        
        newPositions[cellId] = {
          x: table.position.x + xOffset,
          y: table.position.y + yOffset,
          width: cellWidth,
          height: cellHeight
        };
      });
      
      return newPositions;
    });
  };

  const handleDeleteRow = async (tableId: string, rowIndex: number) => {
    const table = template?.tables?.find(t => t.id === tableId);
    if (!table) return;
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta fila?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;
    
    // Marcar todas las celdas de esta fila como eliminadas
    const newDeletedCells: Record<string, boolean> = {};
    table.columns.forEach((col) => {
      const cellId = `${tableId}_${col.id}_row${rowIndex}`;
      newDeletedCells[cellId] = true;
    });
    setDeletedCells((prev) => ({ ...prev, ...newDeletedCells }));
    
    // Eliminar fila de los valores
    setTableValues((prev) => {
      const newTableValues = { ...prev };
      const rows = [...(newTableValues[tableId] || [])];
      rows.splice(rowIndex, 1);
      newTableValues[tableId] = rows;
      return newTableValues;
    });
    
    // Eliminar y reindexar posiciones de celdas
    setCellPositions((prev) => {
      const newPositions = { ...prev };
      const currentRowCount = tableValues[tableId]?.length || 1;
      
      // Eliminar posiciones de la fila eliminada
      table.columns.forEach((col) => {
        const cellId = `${tableId}_${col.id}_row${rowIndex}`;
        delete newPositions[cellId];
      });
      
      // Reindexar las filas posteriores
      for (let i = rowIndex + 1; i < currentRowCount; i++) {
        table.columns.forEach((col) => {
          const oldCellId = `${tableId}_${col.id}_row${i}`;
          const newCellId = `${tableId}_${col.id}_row${i - 1}`;
          
          if (newPositions[oldCellId]) {
            newPositions[newCellId] = { ...newPositions[oldCellId] };
            delete newPositions[oldCellId];
          }
        });
      }
      
      return newPositions;
    });
    
    // También reindexar las celdas eliminadas
    setDeletedCells((prev) => {
      const newDeleted = { ...prev };
      const currentRowCount = tableValues[tableId]?.length || 1;
      
      for (let i = rowIndex + 1; i < currentRowCount; i++) {
        table.columns.forEach((col) => {
          const oldCellId = `${tableId}_${col.id}_row${i}`;
          const newCellId = `${tableId}_${col.id}_row${i - 1}`;
          
          if (newDeleted[oldCellId]) {
            newDeleted[newCellId] = true;
            delete newDeleted[oldCellId];
          }
        });
      }
      
      return newDeleted;
    });
    
    setNotification({ message: 'Fila eliminada. Recuerda hacer clic en "Guardar Posiciones" para guardar los cambios.', type: 'warning' });
  };

  // Función para eliminar una celda individual
  const handleDeleteCell = async (cellId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta celda?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;
    
    setDeletedCells((prev) => ({
      ...prev,
      [cellId]: true
    }));
    
    setNotification({ message: 'Celda eliminada. Recuerda hacer clic en "Guardar Posiciones" para guardar los cambios.', type: 'warning' });
  };

  // Función para agregar un campo personalizado
  const handleAddCustomField = () => {
    const newField: FormField = {
      id: `custom_field_${Date.now()}`,
      name: 'Nuevo Campo',
      type: 'text',
      position: {
        x: 100,
        y: 100,
        width: 200,
        height: 30
      },
      required: false,
      placeholder: 'Escribe aquí...'
    };
    
    setCustomFields((prev) => [...prev, newField]);
    setNotification({ message: 'Campo agregado. Puedes arrastrarlo y editarlo.', type: 'success' });
  };

  // Función para eliminar un campo personalizado
  const handleDeleteCustomField = async (fieldId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar este campo personalizado?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;
    
    setCustomFields((prev) => prev.filter(f => f.id !== fieldId));
    setNotification({ message: 'Campo eliminado correctamente', type: 'success' });
  };

  // Función para eliminar un campo generado por IA
  const handleDeleteAIField = async (fieldId: string) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar este campo generado por IA?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;
    
    setDeletedAIFields((prev) => ({ ...prev, [fieldId]: true }));
    setNotification({ message: 'Campo eliminado correctamente', type: 'success' });
  };

  // Función para actualizar la posición de un campo personalizado
  const handleUpdateCustomFieldPosition = (fieldId: string, newPosition: { x: number; y: number }) => {
    setCustomFields((prev) =>
      prev.map((field) =>
        field.id === fieldId
          ? { ...field, position: { ...field.position, x: newPosition.x, y: newPosition.y } }
          : field
      )
    );
  };

  // Función para iniciar la edición del nombre de un campo personalizado
  const handleStartEditFieldName = (fieldId: string, currentName: string) => {
    setEditingFieldId(fieldId);
    setEditingFieldName(currentName);
  };

  // Función para guardar el nuevo nombre del campo personalizado
  const handleSaveFieldName = () => {
    if (!editingFieldId) return;
    
    const trimmedName = editingFieldName.trim();
    if (trimmedName === '') {
      setNotification({ message: 'El nombre no puede estar vacío', type: 'error' });
      return;
    }
    
    setCustomFields((prev) =>
      prev.map((field) =>
        field.id === editingFieldId
          ? { ...field, name: trimmedName }
          : field
      )
    );
    
    setEditingFieldId(null);
    setEditingFieldName('');
    setNotification({ message: 'Nombre actualizado. Recuerda guardar los cambios.', type: 'success' });
  };

  // Función para cancelar la edición del nombre
  const handleCancelEditFieldName = () => {
    setEditingFieldId(null);
    setEditingFieldName('');
  };

  const handlePrint = async () => {
    if (!template || !canvasRef.current || !user) return;

    try {
      // ===== VALIDAR CAMPOS REQUERIDOS ANTES DE CONTINUAR =====
      // Solo validar si hay API o numeración configurada
      if (template.numerationConfig?.enabled || template.apiConfiguration?.enabled) {
        const missingFields: Array<{ id: string; name: string; value: any; found: boolean }> = [];
        
        // Validar campos requeridos en fieldMappings
        if (template.fieldMappings && template.fieldMappings.length > 0) {
          for (const mapping of template.fieldMappings) {
            if (mapping.required) {
              const value = fieldValues[mapping.fieldId] || controlValues[mapping.fieldId];
              
              if (value === undefined || value === null || value === '' || value === '(se generará al imprimir)') {
                // Buscar el nombre del campo
                let fieldName = mapping.fieldId;
                let foundField = false;
                
                // Buscar en campos IA
                const aiField = template.fields?.find(f => f.id === mapping.fieldId);
                if (aiField) {
                  fieldName = aiField.name;
                  foundField = true;
                }
                
                // Buscar en campos personalizados
                if (!foundField) {
                  const customField = customFields.find(f => f.id === mapping.fieldId);
                  if (customField) {
                    fieldName = customField.name;
                    foundField = true;
                  }
                }
                
                // Buscar en controles avanzados
                if (!foundField) {
                  const control = customControls.find((c: any) => c.id === mapping.fieldId);
                  if (control) {
                    fieldName = control.name;
                    foundField = true;
                  }
                }
                
                missingFields.push({ id: mapping.fieldId, name: fieldName, value, found: foundField });
              }
            }
          }
        }
        
        // Si hay campos faltantes, mostrar error y detener
        if (missingFields.length > 0) {
          
          // Separar campos encontrados de campos no encontrados
          const fieldsFound = missingFields.filter(f => f.found);
          const fieldsNotFound = missingFields.filter(f => !f.found);
          
          let htmlContent = '';
          
          if (fieldsFound.length > 0) {
            htmlContent += `
              <p style="margin-bottom: 1rem;">Debes completar los siguientes campos antes de imprimir:</p>
              <ul style="text-align: left; margin: 1rem auto; max-width: 500px; color: #dc2626;">
                ${fieldsFound.map(field => `<li><strong>${field.name}</strong></li>`).join('')}
              </ul>
            `;
          }
          
          if (fieldsNotFound.length > 0) {
            htmlContent += `
              <div style="margin-top: 1.5rem; padding: 1rem; background: #fef3c7; border-radius: 8px; max-width: 500px; margin-left: auto; margin-right: auto;">
                <p style="color: #92400e; font-weight: 600; margin-bottom: 0.5rem;">⚠️ Campos No Encontrados (eliminados o renombrados):</p>
                <ul style="text-align: left; color: #92400e; font-size: 0.9rem; margin: 0.5rem 0;">
                  ${fieldsNotFound.map(field => `
                    <li style="word-break: break-all; margin-bottom: 0.5rem;">
                      <code style="background: #fde68a; padding: 2px 4px; border-radius: 3px;">${field.id}</code>
                    </li>
                  `).join('')}
                </ul>
                <p style="color: #92400e; font-size: 0.85rem; margin-top: 0.75rem;">
                  <strong>Solución:</strong> Ve a <strong>"Configurar API"</strong> y desmarca <strong>"Requerido"</strong> en estos campos, o elimínalos del mapeo.
                </p>
              </div>
            `;
          }
          
          await Swal.fire({
            icon: 'error',
            title: '❌ Validación de Campos Fallida',
            html: htmlContent,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Entendido',
            width: '600px'
          });
          
          return; // Detener la impresión
        }
      }
      // ===== FIN DE VALIDACIÓN =====
      
      // ===== CONFIRMACIÓN SI SE VA A GENERAR FOLIO O ENVIAR A API =====
      if (template.numerationConfig?.enabled || template.apiConfiguration?.enabled) {
        let confirmMessage = '';
        
        // Obtener el folio actual que ya se está mostrando en el campo
        const currentFolio = template.numerationConfig?.fieldId 
          ? fieldValues[template.numerationConfig.fieldId] 
          : '';
        
        if (template.numerationConfig?.enabled && template.apiConfiguration?.enabled) {
          confirmMessage = `
            <p>Se realizarán las siguientes acciones:</p>
            <ul style="text-align: left; margin: 1rem auto; max-width: 400px;">
              <li>🔢 Generar <strong>folio correlativo: ${currentFolio || 'próximo'}</strong></li>
              <li>📤 Enviar datos a la <strong>API externa</strong></li>
            </ul>
            <p style="color: #f59e0b; margin-top: 1rem;">
              ⚠️ Estas acciones son irreversibles.
            </p>
          `;
        } else if (template.numerationConfig?.enabled) {
          confirmMessage = `
            <p>Se generará el folio: <strong>${currentFolio}</strong></p>
            <p style="color: #f59e0b; margin-top: 1rem;">
              ⚠️ Esta acción es irreversible. El número se incrementará automáticamente.
            </p>
          `;
        } else {
          confirmMessage = `
            <p>Los datos del formulario se enviarán a la <strong>API externa configurada</strong>.</p>
            <p style="margin-top: 1rem;">¿Deseas continuar?</p>
          `;
        }
        
        const confirmation = await Swal.fire({
          title: template.numerationConfig?.enabled ? '🔢 Generar Folio e Imprimir' : '📤 Enviar a API e Imprimir',
          html: confirmMessage + '<p style="margin-top: 1rem;">¿Deseas continuar con la impresión?</p>',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#10b981',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'Sí, continuar',
          cancelButtonText: 'Cancelar'
        });

        if (!confirmation.isConfirmed) {
          return; // Usuario canceló la acción
        }
      }
      // ===== FIN DE CONFIRMACIÓN =====
      
      setPrinting(true);
      
      // ===== ENVIAR A API / GENERAR FOLIO (si está configurado) =====
      if (template.numerationConfig?.enabled || template.apiConfiguration?.enabled) {
        console.log('📤 API: Enviando formulario...', {
          endpoint: template.apiConfiguration?.endpoint,
          method: template.apiConfiguration?.method
        });
        
        const submitResult = await window.electronAPI.submitForm(
          template.id,
          user.id,
          user.email,
          { ...fieldValues, ...Object.entries(tableValues).reduce((acc, [tableId, rows]) => {
            rows.forEach((row, rowIndex) => {
              Object.entries(row).forEach(([colId, value]) => {
                acc[`${tableId}_${colId}_row${rowIndex}`] = value;
              });
            });
            return acc;
          }, {} as Record<string, any>) }
        );
        
        console.log('✅ API: Respuesta recibida', {
          success: submitResult.success,
          folio: submitResult.formNumber,
          error: submitResult.error
        });
        
        // Si falla por campo requerido (respaldo - no debería suceder)
        if (!submitResult.success && submitResult.error && submitResult.error.includes('es requerido')) {
          
          setNotification({ 
            message: `❌ Error: ${submitResult.error}`, 
            type: 'error' 
          });
          
          setPrinting(false);
          return;
        } else if (!submitResult.success) {
          setNotification({ 
            message: `❌ Error al enviar formulario: ${submitResult.error}`, 
            type: 'error' 
          });
        }
        
        if (submitResult.success) {
          // Actualizar el campo con el folio ANTES de imprimir
          if (submitResult.formNumber && template.numerationConfig?.fieldId) {
            await new Promise<void>((resolve) => {
              setFieldValues(prev => {
                const newValues = {
                  ...prev,
                  [template.numerationConfig!.fieldId]: submitResult.formNumber!
                };
                setTimeout(resolve, 0);
                return newValues;
              });
            });
            
            // Si es api-response, dar MÁS tiempo para que se actualice con el folio
            const waitTime = template.numerationConfig.source === 'api-response' ? 1500 : 300;
            
            // Forzar varios ciclos de render
            await new Promise(resolve => setTimeout(resolve, waitTime / 2));
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            await new Promise(resolve => setTimeout(resolve, waitTime / 2));
          }
          
          let successMessage = '';
          if (submitResult.formNumber && template.apiConfiguration?.enabled) {
            successMessage = `✅ Folio: ${submitResult.formNumber} | API: Enviado`;
          } else if (submitResult.formNumber) {
            successMessage = `✅ Folio generado: ${submitResult.formNumber}`;
          } else if (template.apiConfiguration?.enabled) {
            successMessage = `✅ Datos enviados a la API`;
          }
          
          if (successMessage) {
            setNotification({ message: successMessage, type: 'success' });
          }

        } else if (!submitResult.success) {
          setNotification({ 
            message: `⚠️ ${submitResult.error || 'Error al procesar'}`, 
            type: 'warning' 
          });
        }
      }
      // ===== FIN DE ENVÍO/GENERACIÓN =====
      
      // Desactivar modo drag antes de imprimir
      const wasDragMode = isDragMode;
      if (wasDragMode) setIsDragMode(false);
      
      // Esperar render si es api-response
      const isApiResponse = template.numerationConfig?.enabled && 
                            template.numerationConfig?.source === 'api-response';
      
      if (isApiResponse) {
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        await new Promise(requestAnimationFrame);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Imprimir la vista actual con fondo
      const result = await window.electronAPI.printWithBackground({ 
        silent: false, 
        landscape: false 
      });
      
      if (!result.success) {
        setNotification({ message: `Error al imprimir: ${result.error}`, type: 'error' });
      } else {
        // ⭐ MANTENER el folio visible después de imprimir (no resetear)
        // El usuario puede necesitar ver el folio para cancelar o referenciar
        // El folio se actualizará solo cuando se limpie el formulario o se recargue
      }
      
      // Restaurar modo drag si estaba activo
      if (wasDragMode) setIsDragMode(true);
    } catch (err: any) {
      setNotification({ message: `Error al imprimir: ${err.message}`, type: 'error' });
    } finally {
      setPrinting(false);
    }
  };

  const generatePrintHtml = (): string => {
    if (!template) return '';

    // Generar HTML para celdas individuales (sin tabla)
    const cellsHtml = template.tables?.map(table => {
      const rows = tableValues[table.id] || [];
      const cellsArray: string[] = [];
      
      table.columns.forEach((col, colIdx) => {
        rows.forEach((row, rowIdx) => {
          const cellId = `${table.id}_${col.id}_row${rowIdx}`;
          const cellPos = cellPositions[cellId];
          
          // No imprimir celdas eliminadas o sin posición
          if (!cellPos || deletedCells[cellId]) return;
          
          cellsArray.push(`
            <div style="
              position: absolute;
              left: ${cellPos.x}px;
              top: ${cellPos.y}px;
              width: ${cellPos.width}px;
              height: ${cellPos.height}px;
              border: none;
              padding: 2px 4px;
              font-size: ${table.style?.fontSize || 11}px;
              font-family: ${table.style?.fontFamily || 'Arial'};
              background-color: transparent;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              display: flex;
              align-items: center;
              box-sizing: border-box;
            ">
              ${row[col.id] || ''}
            </div>
          `);
        });
      });
      
      return cellsArray.join('');
    }).join('') || '';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            width: ${template.pageSize.width}px;
            height: ${template.pageSize.height}px;
          }
          .form-container {
            position: relative;
            width: ${template.pageSize.width}px;
            height: ${template.pageSize.height}px;
            background-image: url('${template.backgroundImage}');
            background-size: cover;
            background-position: center;
          }
          .field-value {
            position: absolute;
            font-family: Arial, sans-serif;
            display: flex;
            align-items: center;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div class="form-container">
          ${template.fields.filter(field => {
            // Excluir campos eliminados y checkboxes
            if (deletedAIFields[field.id] || field.type === 'checkbox') return false;
            
            // Excluir campos con placeholders o valores vacíos
            const value = fieldValues[field.id];
            if (!value) return false;
            
            // Limpiar el valor y verificar si es un placeholder
            const cleanValue = String(value).trim().toLowerCase();
            const placeholders = [
              'escribe aquí...',
              'escribe aquí',
              'escribe aqui...',
              'escribe aqui',
              '(se generará al imprimir)',
              'se generará al imprimir'
            ];
            
            if (placeholders.includes(cleanValue)) return false;
            
            return true;
          }).map(field => {
            const value = fieldValues[field.id];
            return `
              <div class="field-value" style="
                left: ${field.position.x}px;
                top: ${field.position.y}px;
                width: ${field.position.width}px;
                height: ${field.position.height}px;
                font-size: ${field.fontSize || 12}px;
                color: ${field.color || '#000000'};
              ">
                ${value}
              </div>
            `;
          }).join('')}
          ${customFields.filter(field => {
            const value = fieldValues[field.id];
            if (!value) return false;
            
            // Limpiar el valor y verificar si es un placeholder
            const cleanValue = String(value).trim().toLowerCase();
            const placeholders = [
              'escribe aquí...',
              'escribe aquí',
              'escribe aqui...',
              'escribe aqui',
              '(se generará al imprimir)',
              'se generará al imprimir'
            ];
            
            if (placeholders.includes(cleanValue)) return false;
            
            return true;
          }).map(field => {
            const value = fieldValues[field.id];
            return `
              <div class="field-value" style="
                left: ${field.position.x}px;
                top: ${field.position.y}px;
                width: ${field.position.width}px;
                height: ${field.position.height}px;
                font-size: ${field.fontSize || 12}px;
                color: ${field.color || '#000000'};
              ">
                ${value}
              </div>
            `;
          }).join('')}
          ${customControls.filter((control: CustomControl) => {
            // Excluir controles interactivos de la impresión
            const excludedTypes = ['checkbox', 'radio', 'button', 'toggle', 'file', 'signature'];
            return !excludedTypes.includes(control.type);
          }).map((control: CustomControl) => {
            const value = controlValues[control.id];
            const pos = control.position;
            
            if (!pos || !value) return '';
            
            // Para campos calculados, aplicar el formato configurado
            if (control.type === 'calculated') {
              const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
              const decimals = control.config.decimalPlaces ?? 2;
              const prefix = control.config.prefix || '';
              const suffix = control.config.suffix || '';
              const formatted = formatNumberWithThousands(numValue, decimals);
              const displayValue = prefix + formatted + suffix;
              
              // Aplicar estilos configurados
              const fontSize = control.style?.fontSize ? `${control.style.fontSize}px` : '14px';
              const color = control.style?.color || '#000000';
              const fontFamily = control.style?.fontFamily || 'Arial';
              
              return `
                <div class="field-value" style="
                  left: ${pos.x}px;
                  top: ${pos.y}px;
                  width: ${pos.width}px;
                  height: ${pos.height}px;
                  font-size: ${fontSize};
                  color: ${color};
                  font-family: ${fontFamily};
                ">
                  ${displayValue}
                </div>
              `;
            }
            
            // Para otros tipos de controles (select, date-picker, time-picker, color-picker, range-slider)
            return `
              <div class="field-value" style="
                left: ${pos.x}px;
                top: ${pos.y}px;
                width: ${pos.width}px;
                height: ${pos.height}px;
                font-size: 14px;
                color: #000000;
              ">
                ${value}
              </div>
            `;
          }).join('')}
          ${cellsHtml}
        </div>
      </body>
      </html>
    `;
  };

  const handleClear = async () => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas limpiar todos los campos? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, limpiar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;
    
    // Limpiar campos normales y personalizados
    const initialValues: Record<string, any> = {};
    template?.fields?.forEach((field) => {
      initialValues[field.id] = field.type === 'checkbox' ? false : '';
    });
    customFields.forEach((field) => {
      initialValues[field.id] = field.type === 'checkbox' ? false : '';
    });
    setFieldValues(initialValues);

    // Limpiar valores de tabla pero mantener el número de filas actual
    const clearedTableValues: Record<string, any[]> = {};
    template?.tables?.forEach((table: TableDefinition) => {
      const currentRows = tableValues[table.id] || [];
      const clearedRows = currentRows.map(() => {
        const emptyRow: Record<string, string> = {};
        table.columns.forEach(col => {
          emptyRow[col.id] = '';
        });
        return emptyRow;
      });
      clearedTableValues[table.id] = clearedRows;
    });
    setTableValues(clearedTableValues);

    // Limpiar valores de controles avanzados
    const clearedControlValues: Record<string, any> = {};
    customControls.forEach((control) => {
      // Inicializar con valores vacíos según el tipo
      switch (control.type) {
        case 'toggle':
        case 'checkbox':
          clearedControlValues[control.id] = false;
          break;
        case 'select':
        case 'radio':
          clearedControlValues[control.id] = '';
          break;
        case 'range-slider':
          clearedControlValues[control.id] = control.config.min || 0;
          break;
        case 'file':
        case 'signature':
          clearedControlValues[control.id] = null;
          break;
        case 'calculated':
          clearedControlValues[control.id] = '0.00'; // 0 para que se vea claramente
          break;
        default:
          clearedControlValues[control.id] = '';
      }
    });
    setControlValues(clearedControlValues);

    // ⭐ ACTUALIZAR el folio al siguiente después de limpiar
    if (template && template.numerationConfig?.enabled && template.numerationConfig?.fieldId) {
      if (template.numerationConfig.source === 'api-response') {
        // Para api-response, resetear a placeholder
        setFieldValues(prev => ({
          ...prev,
          [template.numerationConfig!.fieldId]: '(se generará al imprimir)'
        }));
      } else if (template.numerationConfig.source === 'api') {
        // Para API externa, obtener el siguiente folio
        const nextPreview = await window.electronAPI.getFolioFromExternalApi(template.id);
        if (nextPreview.success && nextPreview.formNumber) {
          setFieldValues(prev => ({
            ...prev,
            [template.numerationConfig!.fieldId]: nextPreview.formNumber
          }));
        }
      } else {
        // Para folio local, obtener el siguiente
        const nextPreview = await window.electronAPI.previewNextFolio(template.id);
        if (nextPreview.success && nextPreview.formNumber) {
          setFieldValues(prev => ({
            ...prev,
            [template.numerationConfig!.fieldId]: nextPreview.formNumber
          }));
        }
      }
    }

    // Mostrar notificación de éxito
    setNotification({ 
      message: '🗑️ Formulario limpiado: campos, tablas y controles avanzados', 
      type: 'success' 
    });
  };

  // Funciones para drag and drop
  const handleMouseDown = (e: React.MouseEvent, type: 'field' | 'table' | 'cell' | 'custom', id: string, currentX: number, currentY: number) => {
    if (!isDragMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const offsetX = (e.clientX - canvasRect.left) / scale - currentX;
    const offsetY = (e.clientY - canvasRect.top) / scale - currentY;
    
    setDraggingElement({ type, id });
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!template || !canvasRef.current) return;
    
    // Manejar movimiento de filas seleccionadas
    if (isMovingRows && rowMoveStart) {
      const deltaY = (e.clientY - rowMoveStart.y) / scale;
      
      // Mover todas las celdas de las filas seleccionadas
      setCellPositions(prev => {
        const newPositions = { ...prev };
        
        rowMoveStart.rows.forEach(rowKey => {
          const [tableId, rowPart] = rowKey.split('_row');
          const rowIdx = parseInt(rowPart);
          const table = template.tables?.find(t => t.id === tableId);
          
          if (table) {
            table.columns.forEach(col => {
              const cellId = `${tableId}_${col.id}_row${rowIdx}`;
              if (newPositions[cellId]) {
                newPositions[cellId] = {
                  ...newPositions[cellId],
                  y: newPositions[cellId].y + deltaY
                };
              }
            });
          }
        });
        
        return newPositions;
      });
      
      // Actualizar el punto de inicio
      setRowMoveStart(prev => prev ? { ...prev, y: e.clientY } : null);
      return;
    }
    
    // Manejar resize de tabla o celda
    if (resizingTable) {
      const deltaX = e.clientX - resizingTable.startX;
      const deltaY = e.clientY - resizingTable.startY;
      
      let newWidth = resizingTable.startWidth;
      let newHeight = resizingTable.startHeight;
      
      if (resizingTable.direction === 'e' || resizingTable.direction === 'se') {
        newWidth = Math.max(50, resizingTable.startWidth + deltaX / scale);
      }
      
      if (resizingTable.direction === 's' || resizingTable.direction === 'se') {
        newHeight = Math.max(5, resizingTable.startHeight + deltaY / scale);
      }
      
      // Verificar si es una celda, un campo personalizado, un campo normal o una tabla
      if (cellPositions[resizingTable.id]) {
        // Es una celda
        setCellPositions(prev => ({
          ...prev,
          [resizingTable.id]: {
            ...prev[resizingTable.id],
            width: newWidth,
            height: newHeight
          }
        }));
      } else if (customFields.some(f => f.id === resizingTable.id)) {
        // Es un campo personalizado
        setCustomFields(prev =>
          prev.map(field =>
            field.id === resizingTable.id
              ? { 
                  ...field, 
                  position: { 
                    ...field.position, 
                    width: newWidth,
                    height: newHeight
                  } 
                }
              : field
          )
        );
      } else if (customControls.some(c => c.id === resizingTable.id)) {
        // Es un control avanzado
        setCustomControls(prev =>
          prev.map(ctrl =>
            ctrl.id === resizingTable.id
              ? { 
                  ...ctrl, 
                  position: { 
                    ...ctrl.position, 
                    width: newWidth,
                    height: newHeight
                  } 
                }
              : ctrl
          )
        );
      } else {
        // Verificar si es un campo normal
        const isField = template.fields?.some(f => f.id === resizingTable.id);
        
        if (isField) {
          // Es un campo normal (generado por IA)
          setTemplate(prev => {
            if (!prev) return prev;
            const newTemplate = { ...prev };
            
            newTemplate.fields = prev.fields?.map(field => 
              field.id === resizingTable.id
                ? { 
                    ...field, 
                    position: { 
                      ...field.position, 
                      width: newWidth,
                      height: newHeight
                    } 
                  }
                : field
            );
            
            return newTemplate;
          });
        } else {
          // Es una tabla
          setTemplate(prev => {
            if (!prev) return prev;
            const newTemplate = { ...prev };
            
            newTemplate.tables = prev.tables?.map(table => 
              table.id === resizingTable.id
                ? { 
                    ...table, 
                    position: { 
                      ...table.position, 
                      width: newWidth, 
                      height: newHeight 
                    } 
                  }
                : table
            );
            
            return newTemplate;
          });
        }
      }
      return;
    }
    
    // Manejar drag de elementos
    if (!draggingElement || !isDragMode) return;
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min((e.clientX - canvasRect.left) / scale - dragOffset.x, template.pageSize.width - 50));
    const newY = Math.max(0, Math.min((e.clientY - canvasRect.top) / scale - dragOffset.y, template.pageSize.height - 30));
    
    if (draggingElement.type === 'field') {
      setTemplate(prev => {
        if (!prev) return prev;
        const newTemplate = { ...prev };
        newTemplate.fields = prev.fields.map(field => 
          field.id === draggingElement.id 
            ? { ...field, position: { ...field.position, x: newX, y: newY } }
            : field
        );
        return newTemplate;
      });
    } else if (draggingElement.type === 'table') {
      // Mover toda la tabla completa
      setTemplate(prev => {
        if (!prev) return prev;
        const newTemplate = { ...prev };
        newTemplate.tables = prev.tables?.map(table => 
          table.id === draggingElement.id 
            ? { ...table, position: { ...table.position, x: newX, y: newY } }
            : table
        );
        return newTemplate;
      });
    } else if (draggingElement.type === 'cell') {
      // Mover celda individual
      setCellPositions(prev => ({
        ...prev,
        [draggingElement.id]: {
          ...prev[draggingElement.id],
          x: newX,
          y: newY
        }
      }));
    } else if (draggingElement.type === 'custom') {
      // Verificar si es un campo personalizado o un control avanzado
      const isCustomField = customFields.some(f => f.id === draggingElement.id);
      const isCustomControl = customControls.some(c => c.id === draggingElement.id);
      
      if (isCustomField) {
        // Mover campo personalizado
        handleUpdateCustomFieldPosition(draggingElement.id, { x: newX, y: newY });
      } else if (isCustomControl) {
        // Mover control avanzado
        setCustomControls(prev => prev.map(ctrl =>
          ctrl.id === draggingElement.id
            ? { ...ctrl, position: { ...ctrl.position, x: newX, y: newY } }
            : ctrl
        ));
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
    setResizingTable(null);
    setIsMovingRows(false);
    setRowMoveStart(null);
  };

  // Funciones para resize de tablas, celdas y campos
  const handleResizeStart = (e: React.MouseEvent, elementId: string, direction: 'e' | 's' | 'se', isCell: boolean = false, isField: boolean = false, isCustom: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCustom) {
      // Resize de campo personalizado
      const field = customFields.find(f => f.id === elementId);
      if (!field) return;
      
      setResizingTable({
        id: elementId,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: field.position.width,
        startHeight: field.position.height
      });
    } else if (isField) {
      // Resize de campo normal
      if (!template) return;
      const field = template.fields?.find(f => f.id === elementId);
      if (!field) return;
      
      setResizingTable({
        id: elementId,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: field.position.width,
        startHeight: field.position.height
      });
    } else if (isCell) {
      // Resize de celda de tabla
      const cellPos = cellPositions[elementId];
      if (!cellPos) return;
      
      setResizingTable({
        id: elementId,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: cellPos.width,
        startHeight: cellPos.height
      });
    } else {
      // Resize de tabla completa
      if (!template) return;
      const table = template.tables?.find(t => t.id === elementId);
      if (!table) return;
      
      setResizingTable({
        id: elementId,
        direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: table.position.width,
        startHeight: table.position.height
      });
    }
  };

  const handleSave = async () => {
    if (!template || !user) return;
    
    try {
      setSaving(true);
      
      // Desactivar modo drag al guardar para evitar problemas con inputs
      setIsDragMode(false);
      
      // Agregar las posiciones de celdas, filas actuales y celdas eliminadas a las tablas
      const updatedTables = template.tables?.map(table => ({
        ...table,
        customCellPositions: Object.keys(cellPositions)
          .filter(key => key.startsWith(table.id + '_'))
          .reduce((acc, key) => ({
            ...acc,
            [key]: cellPositions[key]
          }), {}),
        // Guardar las filas actuales (con valores) para que se carguen correctamente
        savedRows: tableValues[table.id] || [],
        // Guardar las celdas eliminadas de esta tabla
        deletedCells: Object.keys(deletedCells)
          .filter(key => key.startsWith(table.id + '_'))
          .reduce((acc, key) => ({
            ...acc,
            [key]: deletedCells[key]
          }), {})
      }));
      
      // Fusionar los campos originales del template (excluyendo los eliminados) con los campos personalizados agregados
      const activeAIFields = (template.fields || []).filter(field => !deletedAIFields[field.id]);
      const allFields = [...activeAIFields, ...customFields];
      
      const result = await window.electronAPI.updateFormTemplate(
        template.id,
        user.id,
        {
          fields: allFields,
          tables: updatedTables,
          pageSize: template.pageSize,
          customControls: customControls // Guardar controles avanzados
        }
      );

      if (result.success) {
        setNotification({ message: '✅ Posiciones guardadas correctamente (incluyendo controles avanzados)', type: 'success' });
      } else {
        setNotification({ message: '❌ Error al guardar: ' + result.error, type: 'error' });
      }
    } catch (err: any) {
      console.error('Error al guardar:', err);
      setNotification({ message: '❌ Error al guardar las posiciones', type: 'error' });
    } finally {
      setSaving(false);
      
      // Forzar la rehabilitación de inputs inmediatamente después de guardar
      setTimeout(() => {
        const sidebar = document.querySelector('.editor-sidebar');
        if (sidebar) {
          const inputs = sidebar.querySelectorAll('input, textarea, select');
          inputs.forEach((input: any) => {
            input.disabled = false;
            input.readOnly = false;
          });
        }
      }, 50);
    }
  };

  if (loading) {
    return (
      <div className="form-editor-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="form-editor-container">
        <div className="error-message">{error || 'Plantilla no encontrada'}</div>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Estilos para ocultar elementos en la impresión */}
      <style>{`
        @media print {
          /* Ocultar controles interactivos */
          .control-checkbox,
          .control-radio,
          .control-button,
          .control-toggle,
          .control-file,
          .control-signature,
          .field-checkbox {
            display: none !important;
          }
          
          /* Ocultar campos con placeholders */
          .field-placeholder {
            display: none !important;
          }
          
          /* Ocultar header y sidebar */
          .editor-header,
          .editor-sidebar {
            display: none !important;
          }
        }
      `}</style>
      
      <div className="form-editor-container">
        <div className="editor-header">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            ← Volver
          </button>
          <h1>{template.name}</h1>
          <div className="editor-actions">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '1rem', cursor: 'pointer' }}>
            <input 
              type="checkbox"
              checked={isDragMode}
              onChange={(e) => setIsDragMode(e.target.checked)}
            />
            <span>🖱️ Modo Configuración</span>
          </label>
          <button className="btn btn-secondary" onClick={handleClear}>
            🗑️ Limpiar
          </button>
          <button className="btn btn-success" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Guardando...' : '💾 Guardar Posiciones'}
          </button>
          <button className="btn btn-success" onClick={handlePrint} disabled={printing}>
            {printing ? '⏳ Imprimiendo...' : '🖨️ Imprimir'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div 
          className="editor-sidebar"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <h2>Campos del Formulario</h2>
          
          {/* Botón para agregar campos personalizados */}
          <button 
            className="btn btn-primary" 
            onClick={handleAddCustomField} 
            style={{
              width: '100%',
              marginBottom: '1.5rem',
              padding: '0.75rem',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            title="Agregar un campo personalizado al formulario"
          >
            ➕ Agregar Campo Personalizado
          </button>
          
          <button
            className="btn btn-add-control"
            onClick={() => {
              setEditingControl(null);
              setShowControlCreator(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              marginBottom: '1rem',
              width: '100%'
            }}
            title="Agregar un control avanzado (botones, selects, etc.)"
          >
            🎛️ Agregar Control Avanzado
          </button>

          <div className="fields-list">
            {template.fields?.map((field) => {
              // ⭐ Determinar si este campo es el campo del folio/correlativo
              const isFolioField = template.numerationConfig?.enabled && 
                                   template.numerationConfig?.fieldId === field.id;
              
              return (
                <div key={field.id} className="field-input-group">
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    color: isFolioField ? '#3b82f6' : 'inherit',
                    fontWeight: isFolioField ? '600' : 'normal'
                  }}>
                    {field.name}
                    {field.required && !isFolioField && <span className="required">*</span>}
                    {isFolioField && (
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        backgroundColor: '#dbeafe',
                        color: '#1e40af',
                        borderRadius: '4px',
                        fontWeight: '600'
                      }}>
                        🔢 Auto
                      </span>
                    )}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      className={isFolioField ? "input folio-field-disabled" : "input"}
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => {
                        // ⭐ Si es campo de folio, NO permitir cambios
                        if (isFolioField) {
                          e.preventDefault();
                          return;
                        }
                        handleFieldChange(field.id, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        // ⭐ Si es campo de folio, bloquear TODAS las teclas
                        if (isFolioField) {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                      onMouseDown={(e) => {
                        if (isFolioField) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        if (isFolioField) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        e.stopPropagation();
                      }}
                      onFocus={(e) => {
                        if (isFolioField) {
                          e.preventDefault();
                          e.target.blur(); // Quitar el foco inmediatamente
                          return;
                        }
                        e.stopPropagation();
                      }}
                      placeholder={field.placeholder}
                      required={field.required && !isFolioField}
                      rows={3}
                      disabled={isFolioField}
                      readOnly={isFolioField}
                      style={isFolioField ? {
                        backgroundColor: '#f0f9ff',
                        color: '#1e40af',
                        fontWeight: '600',
                        cursor: 'not-allowed',
                        borderColor: '#3b82f6',
                        borderWidth: '2px',
                        opacity: '0.8',
                        pointerEvents: 'none'
                      } : {}}
                      title={isFolioField ? 'Este campo se llena automáticamente' : ''}
                    />
                  ) : field.type === 'checkbox' ? (
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={fieldValues[field.id] || false}
                        onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        onFocus={(e) => e.stopPropagation()}
                        disabled={isFolioField}
                        title={isFolioField ? 'Este campo se llena automáticamente' : ''}
                      />
                      <span>{field.placeholder || 'Marcar'}</span>
                    </label>
                  ) : (
                    <input
                      type={field.type}
                      className={isFolioField ? "input folio-field-disabled" : "input"}
                      value={fieldValues[field.id] || ''}
                      onChange={(e) => {
                        // ⭐ Si es campo de folio, NO permitir cambios
                        if (isFolioField) {
                          e.preventDefault();
                          return;
                        }
                        handleFieldChange(field.id, e.target.value);
                      }}
                      onKeyDown={(e) => {
                        // ⭐ Si es campo de folio, bloquear TODAS las teclas
                        if (isFolioField) {
                          e.preventDefault();
                          e.stopPropagation();
                          return false;
                        }
                      }}
                      onMouseDown={(e) => {
                        if (isFolioField) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        if (isFolioField) {
                          e.preventDefault();
                          e.stopPropagation();
                          return;
                        }
                        e.stopPropagation();
                      }}
                      onFocus={(e) => {
                        if (isFolioField) {
                          e.preventDefault();
                          e.target.blur(); // Quitar el foco inmediatamente
                          return;
                        }
                        e.stopPropagation();
                      }}
                      placeholder={field.placeholder}
                      required={field.required && !isFolioField}
                      disabled={isFolioField}
                      readOnly={isFolioField}
                      style={isFolioField ? {
                        backgroundColor: '#f0f9ff',
                        color: '#1e40af',
                        fontWeight: '600',
                        cursor: 'not-allowed',
                        borderColor: '#3b82f6',
                        borderWidth: '2px',
                        opacity: '0.8',
                        pointerEvents: 'none'
                      } : {}}
                      title={isFolioField ? 'Este campo se llena automáticamente' : ''}
                    />
                  )}
                </div>
              );
            })}

            {/* Campos Personalizados - ANTES de las tablas */}
            {customFields.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem', color: '#10b981' }}>
                  📝 Campos Personalizados
                </h3>
                {customFields.map((field) => {
                  // ⭐ Determinar si este campo personalizado es el campo del folio
                  const isFolioField = template.numerationConfig?.enabled && 
                                       template.numerationConfig?.fieldId === field.id;                                  
                  
                  return (
                    <div key={field.id} className="field-input-group">
                      {editingFieldId === field.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            value={editingFieldName}
                            onChange={(e) => setEditingFieldName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveFieldName();
                              if (e.key === 'Escape') handleCancelEditFieldName();
                            }}
                            onBlur={handleSaveFieldName}
                            autoFocus
                            style={{
                              flex: 1,
                              padding: '0.25rem 0.5rem',
                              border: '2px solid #10b981',
                              borderRadius: '4px',
                              fontSize: '0.9rem',
                              fontWeight: '600',
                              color: '#10b981'
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <label 
                          style={{ 
                            color: isFolioField ? '#3b82f6' : '#10b981', 
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s'
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleStartEditFieldName(field.id, field.name);
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = isFolioField ? '#dbeafe' : '#d1fae5';
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = 'transparent';
                          }}
                          title={isFolioField ? 'Campo de folio auto-generado' : 'Haz clic para editar el nombre'}
                        >
                          {field.name}
                          {isFolioField && (
                            <span style={{
                              fontSize: '0.75rem',
                              padding: '2px 6px',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '4px',
                              fontWeight: '600'
                            }}>
                              🔢 Auto
                            </span>
                          )}
                        </label>
                      )}
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input
                          type="text"
                          className={isFolioField ? "input folio-field-disabled" : "input"}
                          value={fieldValues[field.id] || ''}
                          onChange={(e) => {
                            // ⭐ Si es campo de folio, NO permitir cambios
                            if (isFolioField) {
                              e.preventDefault();
                              return;
                            }
                            handleFieldChange(field.id, e.target.value);
                          }}
                          onKeyDown={(e) => {
                            // ⭐ Si es campo de folio, bloquear TODAS las teclas
                            if (isFolioField) {
                              e.preventDefault();
                              e.stopPropagation();
                              return false;
                            }
                          }}
                          onMouseDown={(e) => {
                            if (isFolioField) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            if (isFolioField) {
                              e.preventDefault();
                              e.stopPropagation();
                              return;
                            }
                            e.stopPropagation();
                          }}
                          onFocus={(e) => {
                            if (isFolioField) {
                              e.preventDefault();
                              e.target.blur(); // Quitar el foco inmediatamente
                              return;
                            }
                            e.stopPropagation();
                          }}
                          placeholder={field.placeholder}
                          disabled={isFolioField}
                          readOnly={isFolioField}
                          style={isFolioField ? { 
                            backgroundColor: '#f0f9ff',
                            color: '#1e40af',
                            fontWeight: '600',
                            cursor: 'not-allowed',
                            borderColor: '#3b82f6',
                            borderWidth: '2px',
                            opacity: '0.8',
                            pointerEvents: 'none',
                            width: '100%'
                          } : { 
                            borderColor: '#10b981',
                            borderWidth: '2px',
                            paddingRight: '2.5rem',
                            width: '100%'
                          }}
                          title={isFolioField ? 'Este campo se llena automáticamente' : ''}
                        />
                        
                        {/* Botón de engranaje en el borde derecho */}
                        {!isFolioField && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingFieldConfig(field);
                              setShowFieldConfig(true);
                            }}
                            onMouseDown={(e) => e.stopPropagation()}
                            style={{
                              position: 'absolute',
                              right: '4px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              width: '32px',
                              height: '32px',
                              padding: '0',
                              fontSize: '1rem',
                              backgroundColor: field.formatAsNumber ? '#dcfce7' : '#f3f4f6',
                              border: '1px solid',
                              borderColor: field.formatAsNumber ? '#10b981' : '#d1d5db',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: field.formatAsNumber ? '#10b981' : '#6b7280',
                              transition: 'all 0.2s',
                              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseEnter={(e) => {
                              const btn = e.target as HTMLElement;
                              btn.style.backgroundColor = field.formatAsNumber ? '#bbf7d0' : '#e5e7eb';
                              btn.style.transform = 'translateY(-50%) scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              const btn = e.target as HTMLElement;
                              btn.style.backgroundColor = field.formatAsNumber ? '#dcfce7' : '#f3f4f6';
                              btn.style.transform = 'translateY(-50%) scale(1)';
                            }}
                            title="Configurar formato"
                          >
                            ⚙️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            {template.tables && template.tables.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>📊 Tablas</h3>
                {template.tables.map((table) => (
                  <div 
                    key={table.id} 
                    style={{ marginBottom: '2rem' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ 
                      maxHeight: '400px', 
                      overflowY: 'auto', 
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead style={{ 
                          position: 'sticky', 
                          top: 0, 
                          background: table.style?.headerBackgroundColor || '#f0f0f0',
                          zIndex: 1
                        }}>
                          <tr>
                            <th style={{ 
                              padding: '8px',
                              border: '1px solid #ddd',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              width: '50px'
                            }}>
                              #
                            </th>
                            {table.columns.map((col) => (
                              <th key={col.id} style={{ 
                                padding: '8px',
                                border: '1px solid #ddd',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}>
                                {col.header}
                              </th>
                            ))}
                            <th style={{ 
                              padding: '8px',
                              border: '1px solid #ddd',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              width: '60px'
                            }}>
                              Acciones
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableValues[table.id]?.map((row, rowIndex) => {
                            // Verificar si TODAS las celdas de esta fila están eliminadas
                            const allCellsDeleted = table.columns.every((col) => {
                              const cellId = `${table.id}_${col.id}_row${rowIndex}`;
                              return deletedCells[cellId];
                            });
                            
                            // No mostrar filas con todas las celdas eliminadas
                            if (allCellsDeleted) return null;
                            
                            return (
                            <tr key={rowIndex}>
                              <td style={{ 
                                padding: '4px', 
                                border: '1px solid #ddd',
                                textAlign: 'center',
                                fontWeight: 'bold',
                                backgroundColor: '#f9fafb'
                              }}>
                                {rowIndex + 1}
                              </td>
                              {table.columns.map((col) => {
                                const cellId = `${table.id}_${col.id}_row${rowIndex}`;
                                // Mostrar celda tachada si está eliminada individualmente
                                const isCellDeleted = deletedCells[cellId];
                                
                                return (
                                <td key={col.id} style={{ 
                                  padding: '4px', 
                                  border: '1px solid #ddd',
                                  backgroundColor: isCellDeleted ? '#fee2e2' : 'transparent'
                                }}>
                                  {isCellDeleted ? (
                                    <span style={{ 
                                      color: '#ef4444', 
                                      fontSize: '0.75rem',
                                      fontStyle: 'italic'
                                    }}>
                                      (eliminada)
                                    </span>
                                  ) : (
                                  <input
                                    type={col.type || 'text'}
                                    value={row[col.id] || ''}
                                    onChange={(e) => handleTableCellChange(table.id, rowIndex, col.id, e.target.value)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    onFocus={(e) => e.stopPropagation()}
                                    style={{
                                      width: '100%',
                                      border: 'none',
                                      padding: '4px',
                                      fontSize: '0.85rem',
                                      pointerEvents: 'auto',
                                      cursor: 'text'
                                    }}
                                    disabled={false}
                                    readOnly={false}
                                  />
                                  )}
                                </td>
                              );
                              })}
                              <td style={{ 
                                padding: '4px', 
                                border: '1px solid #ddd',
                                textAlign: 'center'
                              }}>
                                <button
                                  onClick={() => handleDeleteRow(table.id, rowIndex)}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                  }}
                                  title="Eliminar fila"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ 
                      marginTop: '0.5rem', 
                      display: 'flex', 
                      gap: '0.5rem',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={() => handleAddRow(table.id)}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        ➕ Agregar Fila
                      </button>
                      <button
                        onClick={() => setExpandedTableId(table.id)}
                        style={{
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        🔍 Expandir Tabla
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
            
            {/* Modal de Tabla Expandida */}
            {expandedTableId && template.tables && (
              <div 
                className="table-modal-overlay"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999
                }}
                onClick={() => setExpandedTableId(null)}
              >
                <div 
                  className="table-modal-content"
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    width: '95%',
                    maxWidth: '1400px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header del Modal */}
                  <div style={{
                    padding: '1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px 12px 0 0'
                  }}>
                    <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>
                      📊 {template.tables.find(t => t.id === expandedTableId)?.columns[0]?.header || 'Tabla'} - Vista Expandida
                    </h2>
                    <button
                      onClick={() => setExpandedTableId(null)}
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      ✕ Cerrar
                    </button>
                  </div>
                  
                  {/* Contenido de la Tabla */}
                  <div style={{
                    padding: '1.5rem',
                    overflow: 'auto',
                    flex: 1
                  }}>
                    {(() => {
                      const table = template.tables.find(t => t.id === expandedTableId);
                      if (!table) return null;
                      
                      return (
                        <>
                          <div style={{
                            overflowX: 'auto',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                          }}>
                            <table style={{ 
                              width: '100%', 
                              borderCollapse: 'collapse',
                              fontSize: '1rem'
                            }}>
                              <thead style={{
                                backgroundColor: '#f1f5f9',
                                position: 'sticky',
                                top: 0
                              }}>
                                <tr>
                                  <th style={{
                                    padding: '14px 12px',
                                    border: '1px solid #e5e7eb',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    color: '#475569',
                                    width: '60px'
                                  }}>
                                    #
                                  </th>
                                  {table.columns.map((col) => (
                                    <th key={col.id} style={{
                                      padding: '14px 12px',
                                      border: '1px solid #e5e7eb',
                                      fontWeight: '600',
                                      textAlign: 'center',
                                      color: '#475569',
                                      minWidth: '120px'
                                    }}>
                                      {col.header}
                                    </th>
                                  ))}
                                  <th style={{
                                    padding: '14px 12px',
                                    border: '1px solid #e5e7eb',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                    color: '#475569',
                                    width: '100px'
                                  }}>
                                    Acciones
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {tableValues[table.id]?.map((row, rowIndex) => {
                                  // Verificar si todas las celdas de esta fila están eliminadas
                                  const allCellsDeleted = table.columns.every((col) => {
                                    const cellId = `${table.id}_${col.id}_row${rowIndex}`;
                                    return deletedCells[cellId];
                                  });
                                  
                                  if (allCellsDeleted) return null;
                                  
                                  return (
                                    <tr key={rowIndex} style={{
                                      backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc'
                                    }}>
                                      <td style={{
                                        padding: '12px',
                                        border: '1px solid #e5e7eb',
                                        textAlign: 'center',
                                        fontWeight: '600',
                                        color: '#64748b'
                                      }}>
                                        {rowIndex + 1}
                                      </td>
                                      {table.columns.map((col) => {
                                        const cellId = `${table.id}_${col.id}_row${rowIndex}`;
                                        const isCellDeleted = deletedCells[cellId];
                                        
                                        return (
                                          <td key={col.id} style={{
                                            padding: '8px',
                                            border: '1px solid #e5e7eb',
                                            backgroundColor: isCellDeleted ? '#fef2f2' : 'transparent'
                                          }}>
                                            {isCellDeleted ? (
                                              <span style={{
                                                color: '#ef4444',
                                                fontStyle: 'italic',
                                                fontSize: '0.9rem'
                                              }}>
                                                (celda eliminada)
                                              </span>
                                            ) : (
                                              <input
                                                type={col.type || 'text'}
                                                value={row[col.id] || ''}
                                                onChange={(e) => handleTableCellChange(table.id, rowIndex, col.id, e.target.value)}
                                                style={{
                                                  width: '100%',
                                                  border: '1px solid #d1d5db',
                                                  borderRadius: '6px',
                                                  padding: '10px 12px',
                                                  fontSize: '1rem',
                                                  outline: 'none',
                                                  transition: 'border-color 0.2s, box-shadow 0.2s'
                                                }}
                                                onFocus={(e) => {
                                                  e.target.style.borderColor = '#3b82f6';
                                                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                                }}
                                                onBlur={(e) => {
                                                  e.target.style.borderColor = '#d1d5db';
                                                  e.target.style.boxShadow = 'none';
                                                }}
                                              />
                                            )}
                                          </td>
                                        );
                                      })}
                                      <td style={{
                                        padding: '8px',
                                        border: '1px solid #e5e7eb',
                                        textAlign: 'center'
                                      }}>
                                        <button
                                          onClick={() => handleDeleteRow(table.id, rowIndex)}
                                          style={{
                                            background: '#ef4444',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            padding: '8px 14px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: '600',
                                            transition: 'background 0.2s'
                                          }}
                                          onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                                          onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                                          title="Eliminar fila"
                                        >
                                          🗑️ Eliminar
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Botones de acción del modal */}
                          <div style={{
                            marginTop: '1.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <button
                              onClick={() => handleAddRow(table.id)}
                              style={{
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '12px 24px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'background 0.2s'
                              }}
                              onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                              onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                            >
                              ➕ Agregar Nueva Fila
                            </button>
                            
                            <span style={{
                              color: '#64748b',
                              fontSize: '0.9rem'
                            }}>
                              Total de filas: {tableValues[table.id]?.filter((_, idx) => {
                                return !table.columns.every((col) => deletedCells[`${table.id}_${col.id}_row${idx}`]);
                              }).length || 0}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="editor-preview">
          <div className="preview-header">
            <h2>Vista Previa - Formato A4</h2>
            <div className="zoom-controls">
              <button 
                className="zoom-btn" 
                onClick={handleZoomOut}
                title="Reducir zoom"
              >
                🔍−
              </button>
              <span className="zoom-level">{Math.round(scale * 100)}%</span>
              <button 
                className="zoom-btn" 
                onClick={handleZoomIn}
                title="Aumentar zoom"
              >
                🔍+
              </button>
              <button 
                className="zoom-btn zoom-reset" 
                onClick={handleResetZoom}
                title="Restablecer zoom"
              >
                ⟲
              </button>
            </div>
          </div>
          <div className="preview-wrapper">
            <div className="preview-container" style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
              <div
                ref={canvasRef}
                className="form-canvas"
                style={{
                  width: `${template.pageSize.width}px`,
                  height: `${template.pageSize.height}px`,
                  position: 'relative',
                  cursor: isDragMode ? 'move' : 'default'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Imagen de fondo con el mismo tamaño exacto */}
                <img 
                  src={template.backgroundImage} 
                  alt="Formulario"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'top left',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                />
              {template.fields?.map((field) => {
                // No renderizar campos eliminados
                if (deletedAIFields[field.id]) return null;
                
                const value = fieldValues[field.id];
                const cleanValue = value ? String(value).trim().toLowerCase() : '';
                const isPlaceholder = !value || [
                  'escribe aquí...',
                  'escribe aquí',
                  'escribe aqui...',
                  'escribe aqui',
                  '(se generará al imprimir)',
                  'se generará al imprimir'
                ].includes(cleanValue);
                
                // Agregar clase para checkboxes y placeholders
                const fieldClasses = [
                  'field-overlay',
                  field.type === 'checkbox' ? 'field-checkbox' : '',
                  isPlaceholder ? 'field-placeholder' : ''
                ].filter(Boolean).join(' ');
                
                return (
                  <div
                    key={field.id}
                    className={fieldClasses}
                    style={{
                      left: `${field.position.x}px`,
                      top: `${field.position.y}px`,
                      width: `${field.position.width}px`,
                      height: `${field.position.height}px`,
                      fontSize: `${field.fontSize || 12}px`,
                      fontFamily: field.fontFamily || 'Arial',
                      color: field.color || '#000000',
                      cursor: isDragMode ? 'grab' : 'default',
                      userSelect: isDragMode ? 'none' : 'auto',
                      border: isDragMode ? '1px dashed rgba(102, 126, 234, 0.5)' : 'none',
                      backgroundColor: isDragMode ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                      transition: 'background-color 0.2s, border 0.2s',
                      position: 'absolute'
                    }}
                    onMouseDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.classList.contains('resize-handle')) {
                        handleMouseDown(e, 'field', field.id, field.position.x, field.position.y);
                      }
                    }}
                  >
                    {field.type === 'checkbox' ? (
                      value ? '☑' : '☐'
                    ) : (
                      value || ''
                    )}
                    
                    {/* Resize handles y botón de eliminar solo en modo drag */}
                    {isDragMode && (
                      <>
                        {/* Handle derecho (ancho) */}
                        <div
                          className="resize-handle resize-e"
                          onMouseDown={(e) => handleResizeStart(e, field.id, 'e', false, true)}
                          style={{
                            position: 'absolute',
                            right: '-4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '8px',
                            height: '24px',
                            backgroundColor: '#667eea',
                            border: '1px solid white',
                            borderRadius: '4px',
                            cursor: 'ew-resize',
                            zIndex: 1002,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                        
                        {/* Handle inferior (alto) */}
                        <div
                          className="resize-handle resize-s"
                          onMouseDown={(e) => handleResizeStart(e, field.id, 's', false, true)}
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '24px',
                            height: '8px',
                            backgroundColor: '#667eea',
                            border: '1px solid white',
                            borderRadius: '4px',
                            cursor: 'ns-resize',
                            zIndex: 1002,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                        
                        {/* Handle esquina inferior derecha (ancho + alto) */}
                        <div
                          className="resize-handle resize-se"
                          onMouseDown={(e) => handleResizeStart(e, field.id, 'se', false, true)}
                          style={{
                            position: 'absolute',
                            right: '-4px',
                            bottom: '-4px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#667eea',
                            border: '1px solid white',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            zIndex: 1002,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                        
                        {/* Botón para eliminar campo generado por IA */}
                        <button
                          className="delete-field-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteAIField(field.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1003,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            padding: 0,
                            fontWeight: 'bold'
                          }}
                          title="Eliminar campo"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                );
              })}

              {/* Renderizar celdas de tabla como divs independientes */}
              {template.tables?.map((table) => {
                const rows = tableValues[table.id] || [];
                const cells: JSX.Element[] = [];
                const rowElements: JSX.Element[] = [];
                
                // Indicadores de fila SOLO en modo drag
                if (isDragMode) {
                  rows.forEach((row, rowIdx) => {
                    const rowKey = `${table.id}_row${rowIdx}`;
                    const isRowSelected = selectedRows.has(rowKey);
                    
                    // Verificar si la fila tiene celdas no eliminadas
                    const hasVisibleCells = table.columns.some(col => {
                      const cellId = `${table.id}_${col.id}_row${rowIdx}`;
                      return cellPositions[cellId] && !deletedCells[cellId];
                    });
                    
                    if (!hasVisibleCells) return;
                    
                    // Obtener la posición de la primera celda de la fila para el indicador
                    const firstCellId = `${table.id}_${table.columns[0].id}_row${rowIdx}`;
                    const firstCellPos = cellPositions[firstCellId];
                    if (!firstCellPos) return;
                    
                    // Calcular el ancho total de la fila
                    let totalRowWidth = 0;
                    table.columns.forEach(col => {
                      const cellId = `${table.id}_${col.id}_row${rowIdx}`;
                      const cellPos = cellPositions[cellId];
                      if (cellPos && !deletedCells[cellId]) {
                        totalRowWidth += cellPos.width;
                      }
                    });
                    
                    rowElements.push(
                      <div
                        key={`row-indicator-${rowKey}`}
                        className="row-indicator"
                        style={{
                          position: 'absolute',
                          left: `${firstCellPos.x - 30}px`,
                          top: `${firstCellPos.y}px`,
                          width: '25px',
                          height: `${firstCellPos.height}px`,
                          backgroundColor: isRowSelected ? '#3b82f6' : '#94a3b8',
                          borderRadius: '4px 0 0 4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '10px',
                          fontWeight: 'bold',
                          zIndex: 1001,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          transition: 'background-color 0.2s'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Toggle selección de fila
                          setSelectedRows(prev => {
                            const newSet = new Set(prev);
                            if (e.ctrlKey || e.metaKey) {
                              // Multi-selección con Ctrl/Cmd
                              if (newSet.has(rowKey)) {
                                newSet.delete(rowKey);
                              } else {
                                newSet.add(rowKey);
                              }
                            } else {
                              // Selección simple
                              if (newSet.has(rowKey) && newSet.size === 1) {
                                newSet.clear();
                              } else {
                                newSet.clear();
                                newSet.add(rowKey);
                              }
                            }
                            return newSet;
                          });
                        }}
                        onMouseDown={(e) => {
                          if (selectedRows.has(rowKey) || e.ctrlKey || e.metaKey) {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            // Asegurar que la fila actual esté seleccionada
                            const rowsToMove = selectedRows.has(rowKey) 
                              ? Array.from(selectedRows) 
                              : [rowKey];
                            
                            setIsMovingRows(true);
                            setRowMoveStart({ 
                              y: e.clientY, 
                              rows: rowsToMove
                            });
                          }
                        }}
                        title={isRowSelected ? 'Fila seleccionada (Ctrl+clic para multi-selección)' : 'Clic para seleccionar fila'}
                      >
                        {rowIdx + 1}
                      </div>
                    );
                    
                    // Si la fila está seleccionada, agregar resaltado
                    if (isRowSelected) {
                      rowElements.push(
                        <div
                          key={`row-highlight-${rowKey}`}
                          style={{
                            position: 'absolute',
                            left: `${firstCellPos.x - 5}px`,
                            top: `${firstCellPos.y - 2}px`,
                            width: `${totalRowWidth + 10}px`,
                            height: `${firstCellPos.height + 4}px`,
                            border: '2px solid #3b82f6',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            pointerEvents: 'none',
                            zIndex: 999
                          }}
                        />
                      );
                    }
                  });
                }
                
                // Generar cada celda como un div independiente
                table.columns.forEach((col, colIdx) => {
                  rows.forEach((row, rowIdx) => {
                    const cellId = `${table.id}_${col.id}_row${rowIdx}`;
                    const cellPos = cellPositions[cellId];
                    const rowKey = `${table.id}_row${rowIdx}`;
                    const isRowSelected = selectedRows.has(rowKey);
                    
                    // No renderizar celdas eliminadas o sin posición
                    if (!cellPos || deletedCells[cellId]) return;
                    
                    cells.push(
                      <div
                        key={cellId}
                        className="table-cell"
                        style={{
                          position: 'absolute',
                          left: `${cellPos.x}px`,
                          top: `${cellPos.y}px`,
                          width: `${cellPos.width}px`,
                          height: `${cellPos.height}px`,
                          // Bordes solo en modo drag
                          border: isDragMode 
                            ? `${table.style?.borderWidth || 1}px solid ${isRowSelected ? '#3b82f6' : (table.style?.borderColor || '#000000')}`
                            : 'none',
                          padding: '2px 4px',
                          fontSize: `${table.style?.fontSize || 11}px`,
                          fontFamily: table.style?.fontFamily || 'Arial',
                          backgroundColor: isDragMode 
                            ? (isRowSelected ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255, 255, 255, 0.9)')
                            : 'transparent',
                          cursor: isDragMode ? 'grab' : 'default',
                          userSelect: isDragMode ? 'none' : 'auto',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          outline: isDragMode ? '1px dashed rgba(245, 158, 11, 0.3)' : 'none',
                          transition: 'outline 0.2s, border-color 0.2s, background-color 0.2s'
                        }}
                        onMouseDown={(e) => {
                          if (!isDragMode) return;
                          const target = e.target as HTMLElement;
                          if (!target.classList.contains('resize-handle')) {
                            handleMouseDown(e, 'cell', cellId, cellPos.x, cellPos.y);
                          }
                        }}
                      >
                        {row[col.id] || ''}
                        
                        {/* Resize handles solo en modo drag */}
                        {isDragMode && (
                          <>
                            {/* Esquina inferior derecha */}
                            <div
                              className="resize-handle resize-se"
                              onMouseDown={(e) => handleResizeStart(e, cellId, 'se', true)}
                              style={{
                                position: 'absolute',
                                right: '-3px',
                                bottom: '-3px',
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#10b981',
                                border: '1px solid white',
                                borderRadius: '50%',
                                cursor: 'nwse-resize',
                                zIndex: 1002,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                              }}
                            />
                            {/* Borde derecho */}
                            <div
                              className="resize-handle resize-e"
                              onMouseDown={(e) => handleResizeStart(e, cellId, 'e', true)}
                              style={{
                                position: 'absolute',
                                right: '-3px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '6px',
                                height: '20px',
                                backgroundColor: '#10b981',
                                border: '1px solid white',
                                borderRadius: '3px',
                                cursor: 'ew-resize',
                                zIndex: 1002,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                              }}
                            />
                            {/* Borde inferior */}
                            <div
                              className="resize-handle resize-s"
                              onMouseDown={(e) => handleResizeStart(e, cellId, 's', true)}
                              style={{
                                position: 'absolute',
                                bottom: '-3px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '20px',
                                height: '6px',
                                backgroundColor: '#10b981',
                                border: '1px solid white',
                                borderRadius: '3px',
                                cursor: 'ns-resize',
                                zIndex: 1002,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                              }}
                            />
                            
                            {/* Botón para eliminar celda */}
                            <button
                              className="delete-cell-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCell(cellId);
                              }}
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                width: '18px',
                                height: '18px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: '1px solid white',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                fontSize: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1003,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                padding: 0
                              }}
                              title="Eliminar celda"
                            >
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    );
                  });
                });
                
                return [...rowElements, ...cells];
              })}

              {/* Renderizar campos personalizados */}
              {customFields.map((field) => {
                const value = fieldValues[field.id];
                const cleanValue = value ? String(value).trim().toLowerCase() : '';
                const isPlaceholder = !value || [
                  'escribe aquí...',
                  'escribe aquí',
                  'escribe aqui...',
                  'escribe aqui',
                  '(se generará al imprimir)',
                  'se generará al imprimir'
                ].includes(cleanValue);
                
                return (
                  <div
                    key={field.id}
                    className={`field-overlay custom-field ${isPlaceholder ? 'field-placeholder' : ''}`}
                    style={{
                      left: `${field.position.x}px`,
                      top: `${field.position.y}px`,
                      width: `${field.position.width}px`,
                      height: `${field.position.height}px`,
                      fontSize: `${field.fontSize || 12}px`,
                      fontFamily: field.fontFamily || 'Arial',
                      color: field.color || '#000000',
                      cursor: isDragMode ? 'grab' : 'default',
                      userSelect: isDragMode ? 'none' : 'auto',
                      border: isDragMode ? '2px dashed #10b981' : 'none',
                      backgroundColor: isDragMode ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                      transition: 'background-color 0.2s, border 0.2s',
                      position: 'absolute'
                    }}
                    onMouseDown={(e) => {
                      const target = e.target as HTMLElement;
                      if (!target.classList.contains('resize-handle') && !target.classList.contains('delete-field-btn')) {
                        handleMouseDown(e, 'custom', field.id, field.position.x, field.position.y);
                      }
                    }}
                  >
                    {value ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {field.prefix && <span>{field.prefix}</span>}
                        <span>
                          {field.formatAsNumber 
                            ? formatNumberWithThousands(value, field.decimals || 2)
                            : value}
                        </span>
                        {field.suffix && <span>{field.suffix}</span>}
                      </span>
                    ) : (
                      field.placeholder || ''
                    )}
                    
                    {/* Resize handles y botón eliminar solo en modo drag */}
                    {isDragMode && (
                      <>
                        {/* Handle derecho (ancho) */}
                        <div
                          className="resize-handle resize-e"
                          onMouseDown={(e) => handleResizeStart(e, field.id, 'e', false, false, true)}
                          style={{
                            position: 'absolute',
                            right: '-4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '8px',
                            height: '24px',
                            backgroundColor: '#10b981',
                            border: '1px solid white',
                            borderRadius: '4px',
                            cursor: 'ew-resize',
                            zIndex: 1002,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                        
                        {/* Handle inferior (alto) */}
                        <div
                          className="resize-handle resize-s"
                          onMouseDown={(e) => handleResizeStart(e, field.id, 's', false, false, true)}
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '24px',
                            height: '8px',
                            backgroundColor: '#10b981',
                            border: '1px solid white',
                            borderRadius: '4px',
                            cursor: 'ns-resize',
                            zIndex: 1002,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                        
                        {/* Handle esquina inferior derecha (ancho + alto) */}
                        <div
                          className="resize-handle resize-se"
                          onMouseDown={(e) => handleResizeStart(e, field.id, 'se', false, false, true)}
                          style={{
                            position: 'absolute',
                            right: '-4px',
                            bottom: '-4px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#10b981',
                            border: '1px solid white',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            zIndex: 1002,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }}
                        />
                        
                        {/* Botón para eliminar campo personalizado */}
                        <button
                          className="delete-field-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomField(field.id);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1003,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            padding: 0,
                            fontWeight: 'bold'
                          }}
                          title="Eliminar campo"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              
              {/* Renderizar controles avanzados en el visor */}
              {customControls.map((control) => {
                if (!control.visible) return null;
                
                return (
                  <div
                    key={control.id}
                    className={`custom-control-overlay control-${control.type}`}
                    style={{
                      position: 'absolute',
                      left: `${control.position.x}px`,
                      top: `${control.position.y}px`,
                      width: `${control.position.width}px`,
                      minHeight: `${control.position.height}px`,
                      cursor: isDragMode ? 'grab' : 'default',
                      userSelect: isDragMode ? 'none' : 'auto',
                      border: isDragMode ? '2px dashed #8b5cf6' : 'none',
                      backgroundColor: isDragMode ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                      borderRadius: `${control.style.borderRadius || 4}px`,
                      zIndex: 1000
                    }}
                    onMouseDown={(e) => {
                      if (isDragMode) {
                        const target = e.target as HTMLElement;
                        if (!target.classList.contains('resize-handle') && !target.classList.contains('delete-control-btn')) {
                          e.preventDefault();
                          setDraggingElement({ type: 'custom', id: control.id });
                          setDragOffset({
                            x: (e.clientX - (canvasRef.current?.getBoundingClientRect().left || 0)) / scale - control.position.x,
                            y: (e.clientY - (canvasRef.current?.getBoundingClientRect().top || 0)) / scale - control.position.y
                          });
                        }
                      }
                    }}
                  >
                    {renderCustomControl(control, controlValues[control.id], (value) => {
                      setControlValues(prev => ({ ...prev, [control.id]: value }));
                    })}
                    
                    {/* Handles de resize y editar/eliminar solo en modo drag */}
                    {isDragMode && (
                      <>
                        {/* Handle derecho (ancho) */}
                        <div
                          className="resize-handle resize-e"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setResizingTable({
                              id: control.id,
                              direction: 'e',
                              startX: e.clientX,
                              startY: e.clientY,
                              startWidth: control.position.width,
                              startHeight: control.position.height
                            });
                          }}
                          style={{
                            position: 'absolute',
                            right: '-4px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '8px',
                            height: '24px',
                            backgroundColor: '#8b5cf6',
                            border: '1px solid white',
                            borderRadius: '4px',
                            cursor: 'ew-resize',
                            zIndex: 1002
                          }}
                        />
                        
                        {/* Handle inferior (alto) */}
                        <div
                          className="resize-handle resize-s"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setResizingTable({
                              id: control.id,
                              direction: 's',
                              startX: e.clientX,
                              startY: e.clientY,
                              startWidth: control.position.width,
                              startHeight: control.position.height
                            });
                          }}
                          style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '24px',
                            height: '8px',
                            backgroundColor: '#8b5cf6',
                            border: '1px solid white',
                            borderRadius: '4px',
                            cursor: 'ns-resize',
                            zIndex: 1002
                          }}
                        />
                        
                        {/* Handle esquina */}
                        <div
                          className="resize-handle resize-se"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setResizingTable({
                              id: control.id,
                              direction: 'se',
                              startX: e.clientX,
                              startY: e.clientY,
                              startWidth: control.position.width,
                              startHeight: control.position.height
                            });
                          }}
                          style={{
                            position: 'absolute',
                            right: '-4px',
                            bottom: '-4px',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#8b5cf6',
                            border: '1px solid white',
                            borderRadius: '50%',
                            cursor: 'nwse-resize',
                            zIndex: 1002
                          }}
                        />
                        
                        {/* Botón editar */}
                        <button
                          className="edit-control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingControl(control);
                            setShowControlCreator(true);
                          }}
                          style={{
                            position: 'absolute',
                            top: '-10px',
                            left: '-10px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1003
                          }}
                          title="Editar control"
                        >
                          ✏️
                        </button>
                        
                        {/* Botón eliminar */}
                        <button
                          className="delete-control-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            Swal.fire({
                              title: '¿Eliminar control?',
                              text: 'Esta acción no se puede deshacer',
                              icon: 'warning',
                              showCancelButton: true,
                              confirmButtonColor: '#ef4444',
                              cancelButtonColor: '#6b7280',
                              confirmButtonText: 'Sí, eliminar',
                              cancelButtonText: 'Cancelar'
                            }).then((result) => {
                              if (result.isConfirmed) {
                                setCustomControls(prev => prev.filter(c => c.id !== control.id));
                                setNotification({ message: 'Control eliminado', type: 'success' });
                              }
                            });
                          }}
                          style={{
                            position: 'absolute',
                            top: '-10px',
                            right: '-10px',
                            width: '20px',
                            height: '20px',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: '2px solid white',
                            borderRadius: '50%',
                            cursor: 'pointer',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1003
                          }}
                          title="Eliminar control"
                        >
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensaje informativo del modo drag */}
      {isDragMode && (
        <div className="drag-mode-info">
          🖱️ <strong>Modo Arrastrar Activado:</strong> Arrastra los campos para reposicionarlos. 
          No olvides hacer clic en "💾 Guardar Posiciones" cuando termines.
        </div>
      )}

      {/* Notificación no bloqueante */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      {/* Modal de creación de controles avanzados */}
      <ControlCreatorModal
        isOpen={showControlCreator}
        onClose={() => {
          setShowControlCreator(false);
          setEditingControl(null);
        }}
        onSave={(control) => {
          if (editingControl) {
            // Actualizar control existente
            setCustomControls(prev => prev.map(c => c.id === control.id ? control : c));
          } else {
            // Agregar nuevo control
            setCustomControls(prev => [...prev, control]);
          }
          setShowControlCreator(false);
          setEditingControl(null);
          setNotification({ message: 'Control guardado correctamente', type: 'success' });
        }}
        editingControl={editingControl}
        availableFields={[
          // Campos generados por IA
          ...(template?.fields?.filter(f => !deletedAIFields[f.id])?.map(f => ({ 
            id: f.id, 
            name: f.name,
            type: 'ai-field' as const,
            fieldType: f.type
          })) || []),
          // Campos personalizados
          ...customFields.map(f => ({ 
            id: f.id, 
            name: f.name,
            type: 'custom-field' as const,
            fieldType: f.type
          })),
          // Controles avanzados de tipo entrada (excluir button y label que no generan datos)
          ...customControls
            .filter(c => !['button', 'label'].includes(c.type)) // Incluir TODOS excepto botón y etiqueta
            .map(c => ({ 
              id: c.id, 
              name: c.name,
              type: 'control' as const,
              fieldType: c.type
            })),
          // Campo de folio (si está habilitado)
          ...(template?.numerationConfig?.enabled && template?.numerationConfig?.fieldId ? [{
            id: 'folio',
            name: 'Número de Folio',
            type: 'system' as const,
            fieldType: 'text'
          }] : []),
          // Campos del usuario autenticado
          {
            id: 'user_id',
            name: 'Usuario ID',
            type: 'system' as const,
            fieldType: 'text'
          },
          {
            id: 'user_email',
            name: 'Usuario Email',
            type: 'system' as const,
            fieldType: 'text'
          },
          {
            id: 'user_name',
            name: 'Usuario Nombre',
            type: 'system' as const,
            fieldType: 'text'
          }
        ]}
        availableTables={(template?.tables || []).map(t => ({
          id: t.id,
          columns: t.columns.map(c => ({
            id: c.id,
            header: c.header,
            type: c.type
          }))
        }))}
      />
      
      {/* Modal de configuración de campos personalizados */}
      {showFieldConfig && editingFieldConfig && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
          onClick={() => {
            setShowFieldConfig(false);
            setEditingFieldConfig(null);
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: '90vh',
              overflow: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.5rem' }}>
                ⚙️ Configurar Campo
              </h2>
              <button
                onClick={() => {
                  setShowFieldConfig(false);
                  setEditingFieldConfig(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0.25rem',
                  lineHeight: 1
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '8px',
                borderLeft: '4px solid #10b981',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontWeight: '600', color: '#065f46', marginBottom: '0.25rem' }}>
                  {editingFieldConfig.name}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  Tipo: {editingFieldConfig.type}
                </div>
              </div>
              
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>
                🔢 Formato Numérico
              </h3>
              
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
                cursor: 'pointer',
                border: '2px solid',
                borderColor: editingFieldConfig.formatAsNumber ? '#10b981' : '#e5e7eb',
                transition: 'all 0.2s'
              }}>
                <input
                  type="checkbox"
                  checked={editingFieldConfig.formatAsNumber || false}
                  onChange={(e) => {
                    setEditingFieldConfig({
                      ...editingFieldConfig,
                      formatAsNumber: e.target.checked,
                      decimals: e.target.checked ? (editingFieldConfig.decimals || 2) : undefined
                    });
                  }}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer'
                  }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>
                    Activar formato numérico
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Muestra separadores de miles y decimales
                  </div>
                </div>
              </label>
              
              {editingFieldConfig.formatAsNumber && (
                <div style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  border: '1px solid #d1fae5'
                }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: '600', color: '#065f46', fontSize: '0.9rem' }}>
                      Cantidad de decimales:
                    </span>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {[0, 1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          onClick={() => {
                            setEditingFieldConfig({
                              ...editingFieldConfig,
                              decimals: num
                            });
                          }}
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            border: '2px solid',
                            borderColor: (editingFieldConfig.decimals || 2) === num ? '#10b981' : '#d1d5db',
                            backgroundColor: (editingFieldConfig.decimals || 2) === num ? '#10b981' : 'white',
                            color: (editingFieldConfig.decimals || 2) === num ? 'white' : '#374151',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </label>
                  
                  {/* Prefijo y Sufijo */}
                  <div style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '600', color: '#065f46', fontSize: '0.9rem' }}>
                        🏷️ Prefijo y Sufijo:
                      </span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                          Prefijo (antes del número)
                        </label>
                        <input
                          type="text"
                          value={editingFieldConfig.prefix || ''}
                          onChange={(e) => {
                            setEditingFieldConfig({
                              ...editingFieldConfig,
                              prefix: e.target.value
                            });
                          }}
                          placeholder="C$ "
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1fae5',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                          Sufijo (después del número)
                        </label>
                        <input
                          type="text"
                          value={editingFieldConfig.suffix || ''}
                          onChange={(e) => {
                            setEditingFieldConfig({
                              ...editingFieldConfig,
                              suffix: e.target.value
                            });
                          }}
                          placeholder=" USD"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1fae5',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Ejemplos comunes */}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                      <div style={{ marginBottom: '0.25rem' }}>💡 Ejemplos comunes:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {[
                          { label: 'C$ ', type: 'prefix' },
                          { label: '$ ', type: 'prefix' },
                          { label: '€ ', type: 'prefix' },
                          { label: ' USD', type: 'suffix' },
                          { label: '%', type: 'suffix' },
                          { label: ' km', type: 'suffix' }
                        ].map((example, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (example.type === 'prefix') {
                                setEditingFieldConfig({
                                  ...editingFieldConfig,
                                  prefix: example.label
                                });
                              } else {
                                setEditingFieldConfig({
                                  ...editingFieldConfig,
                                  suffix: example.label
                                });
                              }
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.7rem',
                              backgroundColor: 'white',
                              border: '1px solid #d1fae5',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#065f46'
                            }}
                          >
                            {example.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #d1fae5'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                      👁️ Vista previa:
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                      {editingFieldConfig.prefix && <span>{editingFieldConfig.prefix}</span>}
                      <span>{formatNumberWithThousands(1234567.89, editingFieldConfig.decimals || 2)}</span>
                      {editingFieldConfig.suffix && <span>{editingFieldConfig.suffix}</span>}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Sección de Prefijo/Sufijo para campos sin formato numérico */}
              {!editingFieldConfig.formatAsNumber && (
                <div style={{ marginTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>
                    🏷️ Prefijo y Sufijo
                  </h3>
                  
                  <div style={{
                    padding: '1rem',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                          Prefijo (antes del valor)
                        </label>
                        <input
                          type="text"
                          value={editingFieldConfig.prefix || ''}
                          onChange={(e) => {
                            setEditingFieldConfig({
                              ...editingFieldConfig,
                              prefix: e.target.value
                            });
                          }}
                          placeholder="Ej: $ "
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', display: 'block', marginBottom: '0.25rem' }}>
                          Sufijo (después del valor)
                        </label>
                        <input
                          type="text"
                          value={editingFieldConfig.suffix || ''}
                          onChange={(e) => {
                            setEditingFieldConfig({
                              ...editingFieldConfig,
                              suffix: e.target.value
                            });
                          }}
                          placeholder="Ej: kg"
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Ejemplos comunes */}
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      <div style={{ marginBottom: '0.25rem' }}>💡 Ejemplos comunes:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                        {[
                          { label: '# ', type: 'prefix', desc: 'Número' },
                          { label: 'Ref: ', type: 'prefix', desc: 'Referencia' },
                          { label: ' kg', type: 'suffix', desc: 'Kilogramos' },
                          { label: ' m²', type: 'suffix', desc: 'Metros cuadrados' },
                          { label: ' unidades', type: 'suffix', desc: 'Unidades' }
                        ].map((example, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              if (example.type === 'prefix') {
                                setEditingFieldConfig({
                                  ...editingFieldConfig,
                                  prefix: example.label
                                });
                              } else {
                                setEditingFieldConfig({
                                  ...editingFieldConfig,
                                  suffix: example.label
                                });
                              }
                            }}
                            style={{
                              padding: '0.25rem 0.5rem',
                              fontSize: '0.7rem',
                              backgroundColor: 'white',
                              border: '1px solid #d1d5db',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#374151'
                            }}
                            title={example.desc}
                          >
                            {example.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Vista previa */}
                    {(editingFieldConfig.prefix || editingFieldConfig.suffix) && (
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db'
                      }}>
                        <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                          👁️ Vista previa:
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          {editingFieldConfig.prefix && <span>{editingFieldConfig.prefix}</span>}
                          <span>Valor ejemplo</span>
                          {editingFieldConfig.suffix && <span>{editingFieldConfig.suffix}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button
                onClick={() => {
                  setShowFieldConfig(false);
                  setEditingFieldConfig(null);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Aplicar los cambios
                  const updated = customFields.map(f =>
                    f.id === editingFieldConfig.id ? editingFieldConfig : f
                  );
                  setCustomFields(updated);
                  setShowFieldConfig(false);
                  setEditingFieldConfig(null);
                  setNotification({ message: '✅ Configuración guardada', type: 'success' });
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default FormEditor;

