import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  const [scale, setScale] = useState(0.8);

  useEffect(() => {
    loadTemplate();
  }, [id]);

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
        result.template.tables?.forEach((table: TableDefinition) => {
          const rows = [];
          for (let i = 0; i < table.minRows; i++) {
            const row: Record<string, string> = {};
            table.columns.forEach(col => {
              row[col.id] = '';
            });
            rows.push(row);
          }
          initialTableValues[table.id] = rows;
        });
        setTableValues(initialTableValues);
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
        </div>
      </body>
      </html>
    `;
  };

  const handleClear = () => {
    if (!confirm('¿Deseas limpiar todos los campos?')) return;
    
    const initialValues: Record<string, any> = {};
    template?.fields?.forEach((field) => {
      initialValues[field.id] = field.type === 'checkbox' ? false : '';
    });
    setFieldValues(initialValues);

    const initialTableValues: Record<string, any[]> = {};
    template?.tables?.forEach((table: TableDefinition) => {
      const rows = [];
      for (let i = 0; i < table.minRows; i++) {
        const row: Record<string, string> = {};
        table.columns.forEach(col => {
          row[col.id] = '';
        });
        rows.push(row);
      }
      initialTableValues[table.id] = rows;
    });
    setTableValues(initialTableValues);
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
          <button className="btn btn-secondary" onClick={handleClear}>
            🗑️ Limpiar
          </button>
          <button className="btn btn-success" onClick={handlePrint} disabled={printing}>
            {printing ? '⏳ Imprimiendo...' : '🖨️ Imprimir'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-sidebar">
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
                    placeholder={field.placeholder}
                    required={field.required}
                    rows={3}
                  />
                ) : field.type === 'checkbox' ? (
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={fieldValues[field.id] || false}
                      onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                    />
                    <span>{field.placeholder || 'Marcar'}</span>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    className="input"
                    value={fieldValues[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            {template.tables && template.tables.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Tablas</h3>
                {template.tables.map((table) => (
                  <div key={table.id} style={{ marginBottom: '2rem' }}>
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
                          </tr>
                        </thead>
                        <tbody>
                          {tableValues[table.id]?.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {table.columns.map((col) => (
                                <td key={col.id} style={{ padding: '4px', border: '1px solid #ddd' }}>
                                  <input
                                    type={col.type || 'text'}
                                    value={row[col.id] || ''}
                                    onChange={(e) => handleTableCellChange(table.id, rowIndex, col.id, e.target.value)}
                                    style={{
                                      width: '100%',
                                      border: 'none',
                                      padding: '4px',
                                      fontSize: '0.85rem'
                                    }}
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                ref={formRef}
                className="form-canvas"
                style={{
                  width: `${template.pageSize.width}px`,
                  height: `${template.pageSize.height}px`,
                  position: 'relative'
                }}
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
                      color: field.color || '#000000'
                    }}
                  >
                    {field.type === 'checkbox' ? (
                      value ? '☑' : '☐'
                    ) : (
                      value || ''
                    )}
                  </div>
                );
              })}

              {template.tables?.map((table) => (
                <div
                  key={table.id}
                  style={{
                    position: 'absolute',
                    left: `${table.position.x}px`,
                    top: `${table.position.y}px`,
                    width: `${table.position.width}px`
                  }}
                >
                  <table style={{ 
                    width: '100%', 
                    borderCollapse: 'collapse',
                    fontSize: `${table.style?.fontSize || 11}px`,
                    fontFamily: table.style?.fontFamily || 'Arial',
                    border: `${table.style?.borderWidth || 1}px solid ${table.style?.borderColor || '#000000'}`
                  }}>
                    <thead>
                      <tr>
                        {table.columns.map((col) => (
                          <th 
                            key={col.id} 
                            style={{ 
                              width: `${col.width}px`,
                              backgroundColor: table.style?.headerBackgroundColor || '#f0f0f0',
                              color: table.style?.headerColor || '#000000',
                              fontWeight: table.style?.headerFontWeight || 'bold',
                              border: `${table.style?.borderWidth || 1}px solid ${table.style?.borderColor || '#000000'}`,
                              padding: '4px',
                              textAlign: 'center'
                            }}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableValues[table.id]?.map((row, rowIdx) => (
                        <tr key={rowIdx} style={{ height: `${table.rowHeight || 30}px` }}>
                          {table.columns.map((col) => (
                            <td 
                              key={col.id}
                              style={{ 
                                border: `${table.style?.borderWidth || 1}px solid ${table.style?.borderColor || '#000000'}`,
                                padding: '2px',
                                fontSize: `${table.style?.fontSize || 11}px`,
                                textAlign: 'left'
                              }}
                            >
                              {row[col.id] || ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormEditor;

