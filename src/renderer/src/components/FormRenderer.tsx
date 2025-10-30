import React, { useState, useRef } from 'react';
import './FormRenderer.css';

interface FormRendererProps {
  template: any;
  showBackground: boolean;
  onElementClick?: (type: 'static' | 'field' | 'table', id: string) => void;
  selectedElement?: { type: string; id: string } | null;
  values?: Record<string, any>;
  onValueChange?: (fieldId: string, value: any) => void;
  tableRows?: Record<string, number>;
  onPositionChange?: (elementType: 'field' | 'static' | 'table', elementId: string, newPosition: { x: number; y: number }) => void;
  isDragMode?: boolean;
}

const FormRenderer: React.FC<FormRendererProps> = ({ 
  template, 
  showBackground, 
  onElementClick,
  selectedElement,
  values = {},
  onValueChange,
  tableRows = {},
  onPositionChange,
  isDragMode = false
}) => {
  const [draggingElement, setDraggingElement] = useState<{ type: 'field' | 'static' | 'table'; id: string } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, type: 'field' | 'static' | 'table', id: string, currentX: number, currentY: number) => {
    if (!isDragMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const offsetX = e.clientX - canvasRect.left - currentX;
    const offsetY = e.clientY - canvasRect.top - currentY;
    
    setDraggingElement({ type, id });
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingElement || !isDragMode) return;
    
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;

    const newX = Math.max(0, Math.min(e.clientX - canvasRect.left - dragOffset.x, template.pageSize.width - 50));
    const newY = Math.max(0, Math.min(e.clientY - canvasRect.top - dragOffset.y, template.pageSize.height - 30));
    
    onPositionChange?.(draggingElement.type, draggingElement.id, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    if (draggingElement) {
      setDraggingElement(null);
    }
  };

  return (
    <div className="form-renderer">
      <div 
        ref={canvasRef}
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
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          cursor: isDragMode ? 'move' : 'default'
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Renderizar elementos estáticos */}
        {template.staticElements?.map((element: any) => (
          <div
            key={element.id}
            className={`static-element ${selectedElement?.id === element.id ? 'selected' : ''} ${isDragMode ? 'draggable' : ''}`}
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
              cursor: isDragMode ? 'grab' : (onElementClick ? 'pointer' : 'default'),
              overflow: 'hidden',
              userSelect: isDragMode ? 'none' : 'auto'
            }}
            onClick={(e) => {
              if (!isDragMode) {
                onElementClick?.('static', element.id);
              }
            }}
            onMouseDown={(e) => handleMouseDown(e, 'static', element.id, element.position.x, element.position.y)}
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
            className={`form-field ${selectedElement?.id === field.id ? 'selected' : ''} ${isDragMode ? 'draggable' : ''}`}
            style={{
              position: 'absolute',
              left: `${field.position.x}px`,
              top: `${field.position.y}px`,
              width: `${field.position.width}px`,
              height: `${field.position.height}px`,
              cursor: isDragMode ? 'grab' : (onElementClick ? 'pointer' : 'default')
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDragMode) {
                onElementClick?.('field', field.id);
              }
            }}
            onMouseDown={(e) => handleMouseDown(e, 'field', field.id, field.position.x, field.position.y)}
          >
            {field.type === 'checkbox' ? (
              <input
                type="checkbox"
                checked={values[field.id] || false}
                onChange={(e) => onValueChange?.(field.id, e.target.checked)}
                disabled={isDragMode}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: isDragMode ? 'grab' : 'pointer',
                  pointerEvents: isDragMode ? 'none' : 'auto'
                }}
              />
            ) : field.type === 'textarea' ? (
              <textarea
                value={values[field.id] || ''}
                onChange={(e) => onValueChange?.(field.id, e.target.value)}
                placeholder={field.placeholder}
                disabled={isDragMode}
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
                  resize: 'none',
                  pointerEvents: isDragMode ? 'none' : 'auto'
                }}
              />
            ) : (
              <input
                type={field.type}
                value={values[field.id] || ''}
                onChange={(e) => onValueChange?.(field.id, e.target.value)}
                placeholder={field.placeholder}
                disabled={isDragMode}
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
                  textAlign: (field.style?.textAlign as any) || 'left',
                  pointerEvents: isDragMode ? 'none' : 'auto'
                }}
              />
            )}
          </div>
        ))}

        {/* Renderizar tablas como campos arrastrables individuales */}
        {template.tables?.map((table: any) => {
          const numRows = tableRows[table.id] || table.minRows || 5;
          const fields: any[] = [];
          
          // Generar campos individuales para cada celda
          table.columns?.forEach((col: any, colIdx: number) => {
            for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
              const fieldId = `${table.id}_${col.id}_row${rowIdx}`;
              const cellWidth = col.width || 100;
              const cellHeight = table.rowHeight || 30;
              
              // Calcular posición de cada celda
              const xOffset = table.columns.slice(0, colIdx).reduce((acc: number, c: any) => acc + (c.width || 100), 0);
              const yOffset = (rowIdx + 1) * cellHeight; // +1 para el header
              
              fields.push({
                id: fieldId,
                x: table.position.x + xOffset,
                y: table.position.y + yOffset,
                width: cellWidth,
                height: cellHeight,
                type: col.type || 'text',
                label: `${col.header} - Fila ${rowIdx + 1}`
              });
            }
          });
          
          return fields.map((field) => (
            <div
              key={field.id}
              className={`form-field table-field ${selectedElement?.id === field.id ? 'selected' : ''} ${isDragMode ? 'draggable' : ''}`}
              style={{
                position: 'absolute',
                left: `${field.x}px`,
                top: `${field.y}px`,
                width: `${field.width}px`,
                height: `${field.height}px`,
                cursor: isDragMode ? 'grab' : 'default',
                border: '1px solid #ccc',
                backgroundColor: 'white'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragMode) {
                  onElementClick?.('table', field.id);
                }
              }}
              onMouseDown={(e) => handleMouseDown(e, 'table', field.id, field.x, field.y)}
              title={field.label}
            >
              <input
                type={field.type}
                value={values[field.id] || ''}
                onChange={(e) => onValueChange?.(field.id, e.target.value)}
                disabled={isDragMode}
                placeholder={field.label}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  outline: 'none',
                  padding: '4px',
                  fontSize: `${table.style?.fontSize || 11}px`,
                  fontFamily: table.style?.fontFamily || 'Arial',
                  pointerEvents: isDragMode ? 'none' : 'auto'
                }}
              />
            </div>
          ));
        })}
      </div>
    </div>
  );
};

export default FormRenderer;

