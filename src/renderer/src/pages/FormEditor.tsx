import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';
import Swal from 'sweetalert2';
import '../styles/sweetalert-custom.css';
import './FormEditor.css';

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
  };
  apiConfiguration?: {
    enabled: boolean;
    endpoint: string;
    method: string;
  };
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
  
  // Estado para campos personalizados agregados manualmente
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  
  // Estado para controlar qué campo está siendo editado
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingFieldName, setEditingFieldName] = useState<string>('');

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
      console.log('🔍 [FormEditor] Cargando vista previa del folio...', { source: config.source });
      
      // ⭐ NUEVO: Si es api-response, no cargar preview (se genera al imprimir)
      if (config.source === 'api-response') {
        console.log('📡 [FormEditor] Modo API Response: El folio se mostrará después de enviar');
        setFieldValues(prev => ({
          ...prev,
          [config.fieldId]: '(se generará al imprimir)'
        }));
        return;
      }
      
      let previewResult;
      
      // Determinar el origen del folio
      if (config.source === 'api') {
        // Obtener folio desde API externa
        console.log('🌐 [FormEditor] Solicitando folio a API externa');
        previewResult = await window.electronAPI.getFolioFromExternalApi(template.id);
      } else {
        // Folio local (comportamiento original)
        console.log('💻 [FormEditor] Generando folio local');
        previewResult = await window.electronAPI.previewNextFolio(template.id);
      }
      
      if (previewResult.success && previewResult.formNumber) {
        console.log('👁️ [FormEditor] Vista previa del folio:', previewResult.formNumber);
        
        // Mostrar el folio en el campo configurado
        setFieldValues(prev => ({
          ...prev,
          [config.fieldId]: previewResult.formNumber
        }));
      } else {
        console.error('❌ [FormEditor] Error obteniendo folio:', previewResult.error);
      }
    };

    loadFolioPreview();
  }, [template?.id, template?.numerationConfig?.enabled]);

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
    
    // Eliminar fila de los valores
    setTableValues((prev) => {
      const newTableValues = { ...prev };
      const rows = [...(newTableValues[tableId] || [])];
      rows.splice(rowIndex, 1);
      newTableValues[tableId] = rows;
      return newTableValues;
    });
    
    // Eliminar posiciones de las celdas de esa fila
    setCellPositions((prev) => {
      const newPositions = { ...prev };
      
      table.columns.forEach((col) => {
        const cellId = `${tableId}_${col.id}_row${rowIndex}`;
        delete newPositions[cellId];
      });
      
      // Reindexar las filas posteriores
      const remainingRows = (tableValues[tableId]?.length || 1) - 1;
      for (let i = rowIndex + 1; i <= remainingRows; i++) {
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
    
    setNotification({ message: 'Celda eliminada correctamente', type: 'success' });
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
      console.log('🔍 [FormEditor] Verificando configuración...');
      console.log('🔍 [FormEditor] Numeración habilitada?:', template.numerationConfig?.enabled);
      console.log('🔍 [FormEditor] API habilitada?:', template.apiConfiguration?.enabled);
      
      if (template.numerationConfig?.enabled || template.apiConfiguration?.enabled) {
        console.log('📤 [FormEditor] Enviando formulario a submitForm...');
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
        
        console.log('✅ [FormEditor] Respuesta de submitForm:', submitResult);
        console.log('🔍 [FormEditor] Detalles del submitResult:');
        console.log('   - success:', submitResult.success);
        console.log('   - formNumber:', submitResult.formNumber);
        console.log('   - apiResponse:', submitResult.apiResponse);
        console.log('   - error:', submitResult.error);
        console.log('🔍 [FormEditor] Configuración de numeración:', template.numerationConfig);
        
        if (submitResult.success) {
          console.log('🎯 [FormEditor] submitResult.success es TRUE');
          console.log('🎯 [FormEditor] submitResult.formNumber existe?:', !!submitResult.formNumber);
          console.log('🎯 [FormEditor] submitResult.formNumber valor:', submitResult.formNumber);
          console.log('🎯 [FormEditor] template.numerationConfig?.fieldId:', template.numerationConfig?.fieldId);
          
          // ⭐ GUARDAR el folio en una variable para usarlo después
          let folioGenerado: string | null = null;
          
          // ⭐ ACTUALIZADO: Actualizar el campo con el folio ANTES de imprimir
          if (submitResult.formNumber && template.numerationConfig?.fieldId) {
            folioGenerado = submitResult.formNumber;
            console.log('📝 [FormEditor] ✅ ENTRANDO A ACTUALIZAR CAMPO DEL FOLIO');
            console.log('📝 [FormEditor] Folio generado guardado en variable:', folioGenerado);
            console.log('📝 [FormEditor] Actualizando campo del folio:', {
              fieldId: template.numerationConfig.fieldId,
              folio: submitResult.formNumber,
              source: template.numerationConfig.source,
              valorAnterior: fieldValues[template.numerationConfig.fieldId]
            });
            
            // ⭐ IMPORTANTE: Usar una función que preserve el valor
            await new Promise<void>((resolve) => {
              setFieldValues(prev => {
                const newValues = {
                  ...prev,
                  [template.numerationConfig!.fieldId]: submitResult.formNumber!
                };
                console.log('📝 [FormEditor] Nuevo estado de fieldValues:', newValues);
                // Resolver después de actualizar el estado
                setTimeout(resolve, 0);
                return newValues;
              });
            });
            
            // ⭐ Si es api-response, dar MÁS tiempo para que se actualice con el folio
            const waitTime = template.numerationConfig.source === 'api-response' ? 1500 : 300;
            
            console.log('⏳ [FormEditor] Esperando', waitTime, 'ms para re-render...');
            console.log('⏳ [FormEditor] Source:', template.numerationConfig.source);
            
            // Forzar varios ciclos de render
            await new Promise(resolve => setTimeout(resolve, waitTime / 2));
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            await new Promise(requestAnimationFrame);
            await new Promise(resolve => setTimeout(resolve, waitTime / 2));
            
            console.log('✅ [FormEditor] Esperando completado. Folio guardado:', folioGenerado);
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

          // ⭐ NOTA: NO resetear el folio aquí, se hará DESPUÉS de imprimir
          // Guardar una referencia al folio para restaurarlo después
          if (submitResult.formNumber && template.numerationConfig?.fieldId) {
            // El folio ya está en el estado, no hacer nada aquí
            console.log('📌 [FormEditor] Folio mantenido en el estado para impresión');
          }
        } else if (!submitResult.success) {
          setNotification({ 
            message: `⚠️ ${submitResult.error || 'Error al procesar'}`, 
            type: 'warning' 
          });
        }
      } else {
        console.log('ℹ️ [FormEditor] No hay numeración ni API configurada - Solo imprimiendo');
      }
      // ===== FIN DE ENVÍO/GENERACIÓN =====
      
      // Desactivar modo drag antes de imprimir
      const wasDragMode = isDragMode;
      if (wasDragMode) setIsDragMode(false);
      
      // ⭐ ACTUALIZADO: Esperar más tiempo si es api-response para asegurar que el folio se renderice
      const isApiResponse = template.numerationConfig?.enabled && 
                            template.numerationConfig?.source === 'api-response';
      
      if (isApiResponse) {
        console.log('⏳ [FormEditor] Esperando render completo del folio (api-response)...');
        // Esperar varios frames para asegurar re-render completo
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        await new Promise(resolve => setTimeout(resolve, 300));
      } else {
        // Tiempo normal para otros modos
        await new Promise(requestAnimationFrame);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('🖨️ [FormEditor] ========================================');
      console.log('🖨️ [FormEditor] INICIANDO IMPRESIÓN');
      console.log('🖨️ [FormEditor] ========================================');
      console.log('📋 [FormEditor] Valores actuales de campos (todos):', fieldValues);
      if (template.numerationConfig?.fieldId) {
        console.log('📋 [FormEditor] Valor del campo de folio específicamente:', fieldValues[template.numerationConfig.fieldId]);
      }
      console.log('🖨️ [FormEditor] ========================================');
      
      // Imprimir la vista actual con fondo
      const result = await window.electronAPI.printWithBackground({ 
        silent: false, 
        landscape: false 
      });
      
      if (!result.success) {
        setNotification({ message: `Error al imprimir: ${result.error}`, type: 'error' });
      } else {
        console.log('✅ [FormEditor] Impresión completada exitosamente');
        
        // ⭐ DESPUÉS de imprimir, restaurar/preparar el siguiente folio según el modo
        if (template.numerationConfig?.enabled && template.numerationConfig?.fieldId) {
          if (template.numerationConfig.source === 'api-response') {
            // Para api-response, resetear a placeholder
            setTimeout(() => {
              setFieldValues(prev => ({
                ...prev,
                [template.numerationConfig!.fieldId]: '(se generará al imprimir)'
              }));
              console.log('🔄 [FormEditor] Campo de folio reseteado a placeholder (api-response)');
            }, 500);
          } else if (template.numerationConfig.source === 'api') {
            // Para API externa, obtener el siguiente folio
            setTimeout(async () => {
              console.log('🌐 [FormEditor] Solicitando siguiente folio a API externa');
              const nextPreview = await window.electronAPI.getFolioFromExternalApi(template.id);
              if (nextPreview.success && nextPreview.formNumber) {
                setFieldValues(prev => ({
                  ...prev,
                  [template.numerationConfig!.fieldId]: nextPreview.formNumber
                }));
                console.log('👁️ [FormEditor] Próximo folio de API cargado:', nextPreview.formNumber);
              }
            }, 500);
          } else {
            // Para folio local, obtener el siguiente
            setTimeout(async () => {
              console.log('💻 [FormEditor] Generando siguiente folio local');
              const nextPreview = await window.electronAPI.previewNextFolio(template.id);
              if (nextPreview.success && nextPreview.formNumber) {
                setFieldValues(prev => ({
                  ...prev,
                  [template.numerationConfig!.fieldId]: nextPreview.formNumber
                }));
                console.log('👁️ [FormEditor] Próximo folio local cargado:', nextPreview.formNumber);
              }
            }, 500);
          }
        }
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
          
          if (!cellPos) return;
          
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
          ${template.fields.map(field => {
            const value = fieldValues[field.id];
            if (field.type === 'checkbox') {
              return `
                <div class="field-value" style="
                  left: ${field.position.x}px;
                  top: ${field.position.y}px;
                  width: ${field.position.width}px;
                  height: ${field.position.height}px;
                  font-size: ${field.fontSize || 12}px;
                  color: ${field.color || '#000000'};
                ">
                  ${value ? '☑' : '☐'}
                </div>
              `;
            }
            return `
              <div class="field-value" style="
                left: ${field.position.x}px;
                top: ${field.position.y}px;
                width: ${field.position.width}px;
                height: ${field.position.height}px;
                font-size: ${field.fontSize || 12}px;
                color: ${field.color || '#000000'};
              ">
                ${value || ''}
              </div>
            `;
          }).join('')}
          ${customFields.map(field => {
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
                ${value || ''}
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

    // Mostrar notificación de éxito
    setNotification({ message: 'Campos limpiados correctamente', type: 'success' });
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
        newHeight = Math.max(20, resizingTable.startHeight + deltaY / scale);
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
                    width: newWidth
                  } 
                }
              : field
          )
        );
      } else {
        // Verificar si es un campo normal
        const isField = template.fields?.some(f => f.id === resizingTable.id);
        
        if (isField) {
          // Es un campo normal
          setTemplate(prev => {
            if (!prev) return prev;
            const newTemplate = { ...prev };
            
            newTemplate.fields = prev.fields?.map(field => 
              field.id === resizingTable.id
                ? { 
                    ...field, 
                    position: { 
                      ...field.position, 
                      width: newWidth
                      // No cambiar height para campos normales
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
      // Mover campo personalizado
      handleUpdateCustomFieldPosition(draggingElement.id, { x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
    setResizingTable(null);
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
      
      // Agregar las posiciones de celdas Y las filas actuales a las tablas
      const updatedTables = template.tables?.map(table => ({
        ...table,
        customCellPositions: Object.keys(cellPositions)
          .filter(key => key.startsWith(table.id + '_'))
          .reduce((acc, key) => ({
            ...acc,
            [key]: cellPositions[key]
          }), {}),
        // Guardar las filas actuales (con valores) para que se carguen correctamente
        savedRows: tableValues[table.id] || []
      }));
      
      // Fusionar los campos originales del template con los campos personalizados agregados
      const allFields = [...(template.fields || []), ...customFields];
      
      const result = await window.electronAPI.updateFormTemplate(
        template.id,
        user.id,
        {
          fields: allFields,
          tables: updatedTables,
          pageSize: template.pageSize
        }
      );

      if (result.success) {
        setNotification({ message: '✅ Posiciones guardadas correctamente (incluyendo campos personalizados)', type: 'success' });
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
            <span>🖱️ Modo Arrastrar</span>
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
                  
                  // 🔍 DEBUG: Logs para verificar detección
                  if (field.id === template.numerationConfig?.fieldId) {
                    console.log('🔍 [FormEditor] Verificando campo de folio:', {
                      fieldId: field.id,
                      fieldName: field.name,
                      numerationEnabled: template.numerationConfig?.enabled,
                      configuredFieldId: template.numerationConfig?.fieldId,
                      isFolioField: isFolioField,
                      shouldBeDisabled: isFolioField
                    });
                  }
                  
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
                          pointerEvents: 'none'
                        } : { 
                          borderColor: '#10b981',
                          borderWidth: '2px'
                        }}
                        title={isFolioField ? 'Este campo se llena automáticamente' : ''}
                      />
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
                          {tableValues[table.id]?.map((row, rowIndex) => (
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
                              {table.columns.map((col) => (
                                <td key={col.id} style={{ padding: '4px', border: '1px solid #ddd' }}>
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
                                </td>
                              ))}
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
                          ))}
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
                    </div>
                  </div>
                ))}
              </>
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
                const value = fieldValues[field.id];
                return (
                  <div
                    key={field.id}
                    className="field-overlay"
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
                    
                    {/* Resize handle para ajustar ancho solo en modo drag */}
                    {isDragMode && (
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
                    )}
                  </div>
                );
              })}

              {/* Renderizar celdas de tabla como divs independientes */}
              {template.tables?.map((table) => {
                const rows = tableValues[table.id] || [];
                const cells: JSX.Element[] = [];
                
                // Generar cada celda como un div independiente
                table.columns.forEach((col, colIdx) => {
                  rows.forEach((row, rowIdx) => {
                    const cellId = `${table.id}_${col.id}_row${rowIdx}`;
                    const cellPos = cellPositions[cellId];
                    
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
                          border: `${table.style?.borderWidth || 1}px solid ${table.style?.borderColor || '#000000'}`,
                          padding: '2px 4px',
                          fontSize: `${table.style?.fontSize || 11}px`,
                          fontFamily: table.style?.fontFamily || 'Arial',
                          backgroundColor: 'white',
                          cursor: isDragMode ? 'grab' : 'default',
                          userSelect: isDragMode ? 'none' : 'auto',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          display: 'flex',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          outline: isDragMode ? '1px dashed rgba(245, 158, 11, 0.3)' : 'none',
                          transition: 'outline 0.2s'
                        }}
                        onMouseDown={(e) => {
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
                
                return cells;
              })}

              {/* Renderizar campos personalizados */}
              {customFields.map((field) => {
                const value = fieldValues[field.id];
                return (
                  <div
                    key={field.id}
                    className="field-overlay custom-field"
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
                    {value || field.placeholder || ''}
                    
                    {/* Resize handle y botón eliminar solo en modo drag */}
                    {isDragMode && (
                      <>
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
    </div>
  );
};

export default FormEditor;

