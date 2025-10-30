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
  const formRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  
  // Estados para drag and drop
  const [isDragMode, setIsDragMode] = useState(false);
  const [draggingElement, setDraggingElement] = useState<{ type: 'field' | 'table' | 'cell'; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  
  // Estados para resize
  const [resizingTable, setResizingTable] = useState<{ id: string; direction: 'e' | 's' | 'se'; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  
  // Estado para posiciones de celdas individuales (tableId_colId_rowIdx -> {x, y, width, height})
  const [cellPositions, setCellPositions] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  
  // Estado para notificaciones no bloqueantes
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [id]);

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
        setTemplate(result.template);
        
        // Inicializar valores de campos
        const initialValues: Record<string, any> = {};
        result.template.fields?.forEach((field: FormField) => {
          initialValues[field.id] = field.type === 'checkbox' ? false : '';
        });
        setFieldValues(initialValues);

        // Inicializar valores de tablas
        const initialTableValues: Record<string, any[]> = {};
        const initialCellPositions: Record<string, { x: number; y: number; width: number; height: number }> = {};
        
        result.template.tables?.forEach((table: TableDefinition) => {
          // Usar las filas guardadas si existen, si no, crear filas vacías basadas en minRows
          const savedRows = (table as any).savedRows;
          let rows = [];
          
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

  const handlePrint = async () => {
    if (!template || !formRef.current) return;

    try {
      setPrinting(true);

      // Generar HTML del formulario con los valores
      const printHtml = generatePrintHtml();

      const result = await window.electronAPI.printForm(printHtml);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
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
    
    // Limpiar campos normales
    const initialValues: Record<string, any> = {};
    template?.fields?.forEach((field) => {
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
  const handleMouseDown = (e: React.MouseEvent, type: 'field' | 'table' | 'cell', id: string, currentX: number, currentY: number) => {
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
      
      // Verificar si es una celda, un campo o una tabla
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
    }
  };

  const handleMouseUp = () => {
    setDraggingElement(null);
    setResizingTable(null);
  };

  // Funciones para resize de tablas, celdas y campos
  const handleResizeStart = (e: React.MouseEvent, elementId: string, direction: 'e' | 's' | 'se', isCell: boolean = false, isField: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isField) {
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
      
      const result = await window.electronAPI.updateFormTemplate(
        template.id,
        user.id,
        {
          fields: template.fields,
          tables: updatedTables,
          pageSize: template.pageSize
        }
      );

      if (result.success) {
        setNotification({ message: '✅ Posiciones guardadas correctamente', type: 'success' });
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
          <div className="fields-list">
            {template.fields?.map((field) => (
              <div key={field.id} className="field-input-group">
                <label>
                  {field.name}
                  {field.required && <span className="required">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    className="input"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                    disabled={false}
                    readOnly={false}
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
                      disabled={false}
                    />
                    <span>{field.placeholder || 'Marcar'}</span>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    className="input"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    onFocus={(e) => e.stopPropagation()}
                    placeholder={field.placeholder}
                    required={field.required}
                    disabled={false}
                    readOnly={false}
                  />
                )}
              </div>
            ))}

            {template.tables && template.tables.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Tablas</h3>
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
                ref={(el) => { 
                  formRef.current = el; 
                  canvasRef.current = el; 
                }}
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
                    
                    if (!cellPos) return;
                    
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
                          </>
                        )}
                      </div>
                    );
                  });
                });
                
                return cells;
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

