import React, { useState, useEffect } from 'react';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  selectedElement: { type: 'static' | 'field' | 'table'; id: string } | null;
  template: any;
  onUpdateElement: (type: string, id: string, updates: any) => void;
  onClose: () => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElement,
  template,
  onUpdateElement,
  onClose
}) => {
  const [localProps, setLocalProps] = useState<any>({});

  useEffect(() => {
    if (!selectedElement) {
      setLocalProps({});
      return;
    }

    let element: any = null;
    if (selectedElement.type === 'static') {
      element = template.staticElements?.find((e: any) => e.id === selectedElement.id);
    } else if (selectedElement.type === 'field') {
      element = template.fields?.find((e: any) => e.id === selectedElement.id);
    } else if (selectedElement.type === 'table') {
      element = template.tables?.find((e: any) => e.id === selectedElement.id);
    }

    if (element) {
      setLocalProps({
        ...element,
        style: { ...element.style },
        position: { ...element.position }
      });
    }
  }, [selectedElement, template]);

  if (!selectedElement || !localProps.id) {
    return (
      <div className="properties-panel empty">
        <div className="properties-header">
          <h3>Propiedades</h3>
        </div>
        <div className="properties-body">
          <p className="empty-message">Selecciona un elemento para editar sus propiedades</p>
        </div>
      </div>
    );
  }

  const handleChange = (path: string, value: any) => {
    const newProps = { ...localProps };
    const keys = path.split('.');
    let current: any = newProps;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setLocalProps(newProps);
  };

  const handleApply = () => {
    onUpdateElement(selectedElement.type, selectedElement.id, localProps);
  };

  const renderStaticElementProps = () => (
    <>
      <div className="prop-group">
        <label>Tipo</label>
        <select 
          value={localProps.type || 'text'}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="text">Texto</option>
          <option value="line">Línea</option>
          <option value="rectangle">Rectángulo</option>
          <option value="logo">Logo</option>
        </select>
      </div>

      {localProps.type === 'text' && (
        <div className="prop-group">
          <label>Contenido</label>
          <textarea 
            value={localProps.content || ''}
            onChange={(e) => handleChange('content', e.target.value)}
            rows={3}
          />
        </div>
      )}

      {renderPositionProps()}
      {renderStyleProps()}
    </>
  );

  const renderFieldProps = () => (
    <>
      <div className="prop-group">
        <label>Nombre</label>
        <input 
          type="text"
          value={localProps.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div className="prop-group">
        <label>Tipo de campo</label>
        <select 
          value={localProps.type || 'text'}
          onChange={(e) => handleChange('type', e.target.value)}
        >
          <option value="text">Texto</option>
          <option value="number">Número</option>
          <option value="date">Fecha</option>
          <option value="checkbox">Checkbox</option>
          <option value="textarea">Área de texto</option>
        </select>
      </div>

      <div className="prop-group">
        <label>Placeholder</label>
        <input 
          type="text"
          value={localProps.placeholder || ''}
          onChange={(e) => handleChange('placeholder', e.target.value)}
        />
      </div>

      <div className="prop-group">
        <label>
          <input 
            type="checkbox"
            checked={localProps.required || false}
            onChange={(e) => handleChange('required', e.target.checked)}
          />
          {' '}Campo requerido
        </label>
      </div>

      {renderPositionProps()}
      {renderStyleProps()}
    </>
  );

  const renderTableProps = () => (
    <>
      <div className="prop-group">
        <label>Columnas (JSON)</label>
        <textarea 
          value={JSON.stringify(localProps.columns || [], null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              handleChange('columns', parsed);
            } catch (err) {
              // Ignorar errores de JSON inválido mientras se escribe
            }
          }}
          rows={6}
          style={{ fontFamily: 'monospace', fontSize: '11px' }}
        />
      </div>

      <div className="prop-group">
        <label>Filas mínimas</label>
        <input 
          type="number"
          value={localProps.minRows || 1}
          onChange={(e) => handleChange('minRows', parseInt(e.target.value))}
          min="1"
        />
      </div>

      <div className="prop-group">
        <label>Filas máximas</label>
        <input 
          type="number"
          value={localProps.maxRows || 50}
          onChange={(e) => handleChange('maxRows', parseInt(e.target.value))}
          min="1"
        />
      </div>

      <div className="prop-group">
        <label>Altura de fila (px)</label>
        <input 
          type="number"
          value={localProps.rowHeight || 30}
          onChange={(e) => handleChange('rowHeight', parseInt(e.target.value))}
          min="10"
        />
      </div>

      {renderPositionProps()}
      {renderTableStyleProps()}
    </>
  );

  const renderPositionProps = () => (
    <div className="prop-section">
      <h4>Posición</h4>
      <div className="prop-row">
        <div className="prop-group">
          <label>X</label>
          <input 
            type="number"
            value={localProps.position?.x || 0}
            onChange={(e) => handleChange('position.x', parseInt(e.target.value))}
          />
        </div>
        <div className="prop-group">
          <label>Y</label>
          <input 
            type="number"
            value={localProps.position?.y || 0}
            onChange={(e) => handleChange('position.y', parseInt(e.target.value))}
          />
        </div>
      </div>
      <div className="prop-row">
        <div className="prop-group">
          <label>Ancho</label>
          <input 
            type="number"
            value={localProps.position?.width || 100}
            onChange={(e) => handleChange('position.width', parseInt(e.target.value))}
          />
        </div>
        <div className="prop-group">
          <label>Alto</label>
          <input 
            type="number"
            value={localProps.position?.height || 20}
            onChange={(e) => handleChange('position.height', parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );

  const renderStyleProps = () => (
    <div className="prop-section">
      <h4>Estilos</h4>
      
      <div className="prop-group">
        <label>Tamaño de fuente (px)</label>
        <input 
          type="number"
          value={localProps.style?.fontSize || 12}
          onChange={(e) => handleChange('style.fontSize', parseInt(e.target.value))}
          min="6"
          max="72"
        />
      </div>

      <div className="prop-group">
        <label>Familia de fuente</label>
        <select 
          value={localProps.style?.fontFamily || 'Arial'}
          onChange={(e) => handleChange('style.fontFamily', e.target.value)}
        >
          <option value="Arial">Arial</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>

      <div className="prop-group">
        <label>Peso de fuente</label>
        <select 
          value={localProps.style?.fontWeight || 'normal'}
          onChange={(e) => handleChange('style.fontWeight', e.target.value)}
        >
          <option value="normal">Normal</option>
          <option value="bold">Negrita</option>
          <option value="bolder">Más negrita</option>
        </select>
      </div>

      <div className="prop-row">
        <div className="prop-group">
          <label>Color</label>
          <input 
            type="color"
            value={localProps.style?.color || '#000000'}
            onChange={(e) => handleChange('style.color', e.target.value)}
          />
        </div>
        <div className="prop-group">
          <label>Fondo</label>
          <input 
            type="color"
            value={localProps.style?.backgroundColor || '#ffffff'}
            onChange={(e) => handleChange('style.backgroundColor', e.target.value)}
          />
        </div>
      </div>

      <div className="prop-group">
        <label>Alineación</label>
        <select 
          value={localProps.style?.textAlign || 'left'}
          onChange={(e) => handleChange('style.textAlign', e.target.value)}
        >
          <option value="left">Izquierda</option>
          <option value="center">Centro</option>
          <option value="right">Derecha</option>
          <option value="justify">Justificado</option>
        </select>
      </div>

      <div className="prop-group">
        <label>Ancho de borde (px)</label>
        <input 
          type="number"
          value={localProps.style?.borderWidth || 0}
          onChange={(e) => handleChange('style.borderWidth', parseInt(e.target.value))}
          min="0"
        />
      </div>

      {(localProps.style?.borderWidth || 0) > 0 && (
        <>
          <div className="prop-group">
            <label>Estilo de borde</label>
            <select 
              value={localProps.style?.borderStyle || 'solid'}
              onChange={(e) => handleChange('style.borderStyle', e.target.value)}
            >
              <option value="solid">Sólido</option>
              <option value="dashed">Guiones</option>
              <option value="dotted">Puntos</option>
              <option value="double">Doble</option>
            </select>
          </div>
          <div className="prop-group">
            <label>Color de borde</label>
            <input 
              type="color"
              value={localProps.style?.borderColor || '#000000'}
              onChange={(e) => handleChange('style.borderColor', e.target.value)}
            />
          </div>
        </>
      )}

      <div className="prop-group">
        <label>Padding (px)</label>
        <input 
          type="number"
          value={localProps.style?.padding || 0}
          onChange={(e) => handleChange('style.padding', parseInt(e.target.value))}
          min="0"
        />
      </div>
    </div>
  );

  const renderTableStyleProps = () => (
    <div className="prop-section">
      <h4>Estilos de Tabla</h4>
      
      <div className="prop-group">
        <label>Fondo de encabezado</label>
        <input 
          type="color"
          value={localProps.style?.headerBackgroundColor || '#f0f0f0'}
          onChange={(e) => handleChange('style.headerBackgroundColor', e.target.value)}
        />
      </div>

      <div className="prop-group">
        <label>Color de texto encabezado</label>
        <input 
          type="color"
          value={localProps.style?.headerColor || '#000000'}
          onChange={(e) => handleChange('style.headerColor', e.target.value)}
        />
      </div>

      <div className="prop-group">
        <label>Color de borde</label>
        <input 
          type="color"
          value={localProps.style?.borderColor || '#000000'}
          onChange={(e) => handleChange('style.borderColor', e.target.value)}
        />
      </div>

      <div className="prop-group">
        <label>Ancho de borde (px)</label>
        <input 
          type="number"
          value={localProps.style?.borderWidth || 1}
          onChange={(e) => handleChange('style.borderWidth', parseInt(e.target.value))}
          min="0"
        />
      </div>

      <div className="prop-group">
        <label>Tamaño de fuente (px)</label>
        <input 
          type="number"
          value={localProps.style?.fontSize || 11}
          onChange={(e) => handleChange('style.fontSize', parseInt(e.target.value))}
          min="6"
          max="72"
        />
      </div>
    </div>
  );

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>
          Propiedades 
          <span className={`element-type-badge ${selectedElement.type}`}>
            {selectedElement.type === 'static' ? 'Estático' : 
             selectedElement.type === 'field' ? 'Campo' : 'Tabla'}
          </span>
        </h3>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>

      <div className="properties-body">
        {selectedElement.type === 'static' && renderStaticElementProps()}
        {selectedElement.type === 'field' && renderFieldProps()}
        {selectedElement.type === 'table' && renderTableProps()}
      </div>

      <div className="properties-footer">
        <button className="btn btn-primary" onClick={handleApply}>
          Aplicar Cambios
        </button>
      </div>
    </div>
  );
};

export default PropertiesPanel;

