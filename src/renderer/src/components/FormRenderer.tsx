import React from 'react';
import './FormRenderer.css';

interface FormRendererProps {
  template: any;
  showBackground: boolean;
  onElementClick?: (type: 'static' | 'field' | 'table', id: string) => void;
  selectedElement?: { type: string; id: string } | null;
  values?: Record<string, any>;
  onValueChange?: (fieldId: string, value: any) => void;
  tableRows?: Record<string, number>;
}

const FormRenderer: React.FC<FormRendererProps> = ({ 
  template, 
  showBackground, 
  onElementClick,
  selectedElement,
  values = {},
  onValueChange,
  tableRows = {}
}) => {
  const handleTableRowsChange = (tableId: string, newRowCount: number) => {
    // Notificar cambio de filas
  };

  return (
    <div className="form-renderer">
      <div 
        className="form-canvas"
        style={{
          width: `${template.pageSize.width}px`,
          height: `${template.pageSize.height}px`,
          position: 'relative',
          backgroundImage: showBackground ? `url('${template.backgroundImage}')` : 'none',
          backgroundColor: showBackground ? 'transparent' : '#ffffff',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          border: '1px solid #ddd',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        {/* Renderizar elementos estáticos */}
        {template.staticElements?.map((element: any) => (
          <div
            key={element.id}
            className={`static-element ${selectedElement?.id === element.id ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: `${element.position.x}px`,
              top: `${element.position.y}px`,
              width: `${element.position.width}px`,
              height: `${element.position.height}px`,
              fontSize: `${element.style?.fontSize || 12}px`,
              fontFamily: element.style?.fontFamily || 'Arial',
              fontWeight: element.style?.fontWeight || 'normal',
              color: element.style?.color || '#000000',
              backgroundColor: element.style?.backgroundColor || 'transparent',
              border: element.style?.borderWidth 
                ? `${element.style.borderWidth}px ${element.style.borderStyle || 'solid'} ${element.style.borderColor || '#000000'}`
                : 'none',
              textAlign: (element.style?.textAlign as any) || 'left',
              padding: `${element.style?.padding || 0}px`,
              display: 'flex',
              alignItems: 'center',
              cursor: onElementClick ? 'pointer' : 'default',
              overflow: 'hidden'
            }}
            onClick={() => onElementClick?.('static', element.id)}
          >
            {element.type === 'text' && element.content}
            {element.type === 'line' && <div style={{ width: '100%', height: '100%', backgroundColor: element.style?.borderColor || '#000' }} />}
            {element.type === 'rectangle' && null}
          </div>
        ))}

        {/* Renderizar campos editables */}
        {template.fields?.map((field: any) => (
          <div
            key={field.id}
            className={`form-field ${selectedElement?.id === field.id ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: `${field.position.x}px`,
              top: `${field.position.y}px`,
              width: `${field.position.width}px`,
              height: `${field.position.height}px`,
              cursor: onElementClick ? 'pointer' : 'default'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onElementClick?.('field', field.id);
            }}
          >
            {field.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={values[field.id] || false}
                onChange={(e) => onValueChange?.(field.id, e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer'
                }}
              />
            ) : field.type === 'textarea' ? (
              <textarea
                value={values[field.id] || ''}
                onChange={(e) => onValueChange?.(field.id, e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: `${field.style?.fontSize || 12}px`,
                  fontFamily: field.style?.fontFamily || 'Arial',
                  color: field.style?.color || '#000000',
                  border: field.style?.borderWidth 
                    ? `${field.style.borderWidth}px ${field.style.borderStyle || 'solid'} ${field.style.borderColor || '#000000'}`
                    : '1px solid #ccc',
                  padding: `${field.style?.padding || 4}px`,
                  resize: 'none'
                }}
              />
            ) : (
              <input
                type={field.type}
                value={values[field.id] || ''}
                onChange={(e) => onValueChange?.(field.id, e.target.value)}
                placeholder={field.placeholder}
                style={{
                  width: '100%',
                  height: '100%',
                  fontSize: `${field.style?.fontSize || 12}px`,
                  fontFamily: field.style?.fontFamily || 'Arial',
                  color: field.style?.color || '#000000',
                  border: field.style?.borderWidth 
                    ? `${field.style.borderWidth}px ${field.style.borderStyle || 'solid'} ${field.style.borderColor || '#000000'}`
                    : '1px solid #ccc',
                  padding: `${field.style?.padding || 4}px`,
                  textAlign: (field.style?.textAlign as any) || 'left'
                }}
              />
            )}
          </div>
        ))}

        {/* Renderizar tablas */}
        {template.tables?.map((table: any) => {
          const numRows = tableRows[table.id] || table.minRows || 5;
          
          return (
            <div
              key={table.id}
              className={`form-table ${selectedElement?.id === table.id ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                left: `${table.position.x}px`,
                top: `${table.position.y}px`,
                width: `${table.position.width}px`,
                cursor: onElementClick ? 'pointer' : 'default'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onElementClick?.('table', table.id);
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
                    {table.columns?.map((col: any) => (
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
                  {Array.from({ length: numRows }).map((_, rowIdx) => (
                    <tr key={rowIdx} style={{ height: `${table.rowHeight || 30}px` }}>
                      {table.columns?.map((col: any) => (
                        <td 
                          key={col.id}
                          style={{ 
                            border: `${table.style?.borderWidth || 1}px solid ${table.style?.borderColor || '#000000'}`,
                            padding: '2px'
                          }}
                        >
                          <input
                            type={col.type || 'text'}
                            style={{
                              width: '100%',
                              border: 'none',
                              outline: 'none',
                              padding: '2px',
                              fontSize: `${table.style?.fontSize || 11}px`,
                              fontFamily: table.style?.fontFamily || 'Arial'
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormRenderer;

