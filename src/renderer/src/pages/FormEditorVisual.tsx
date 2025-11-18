import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormRenderer from '../components/FormRenderer';
import PropertiesPanel from '../components/PropertiesPanel';
import Notification from '../components/Notification';
import './FormEditorVisual.css';

declare global {
  interface Window {
    electronAPI: any;
  }
}

const FormEditorVisual: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackground, setShowBackground] = useState(true);
  const [selectedElement, setSelectedElement] = useState<{ type: 'static' | 'field' | 'table'; id: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(false);
  const [isDragMode, setIsDragMode] = useState(true); // Modo drag activado por defecto
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      setError(null);

      const user = localStorage.getItem('user');
      if (!user) {
        navigate('/login');
        return;
      }

      const result = await window.electronAPI.getFormTemplate(id);
      
      if (result.success) {
        setTemplate(result.data);
      } else {
        setError(result.error || 'Error al cargar el formulario');
      }
    } catch (err: any) {
      console.error('Error al cargar plantilla:', err);
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleElementClick = (type: 'static' | 'field' | 'table', id: string) => {
    setSelectedElement({ type, id });
    setShowPropertiesPanel(true);
  };

  const handleUpdateElement = (type: string, id: string, updates: any) => {
    setTemplate((prev: any) => {
      const newTemplate = { ...prev };
      
      if (type === 'static') {
        newTemplate.staticElements = prev.staticElements.map((el: any) => 
          el.id === id ? { ...el, ...updates } : el
        );
      } else if (type === 'field') {
        newTemplate.fields = prev.fields.map((el: any) => 
          el.id === id ? { ...el, ...updates } : el
        );
      } else if (type === 'table') {
        newTemplate.tables = prev.tables.map((el: any) => 
          el.id === id ? { ...el, ...updates } : el
        );
      }
      
      return newTemplate;
    });
  };

  const handlePositionChange = (elementType: 'field' | 'static' | 'table', elementId: string, newPosition: { x: number; y: number }) => {
    setTemplate((prev: any) => {
      const newTemplate = { ...prev };
      
      if (elementType === 'static' && newTemplate.staticElements) {
        newTemplate.staticElements = prev.staticElements.map((el: any) => 
          el.id === elementId ? { ...el, position: { ...el.position, x: newPosition.x, y: newPosition.y } } : el
        );
      } else if (elementType === 'field' && newTemplate.fields) {
        newTemplate.fields = prev.fields.map((el: any) => 
          el.id === elementId ? { ...el, position: { ...el.position, x: newPosition.x, y: newPosition.y } } : el
        );
      } else if (elementType === 'table' && newTemplate.tables) {
        // Para campos de tabla individuales, necesitamos actualizar la tabla completa
        // El ID del campo es del formato: tableId_columnId_rowIdx
        const [tableId] = elementId.split('_');
        newTemplate.tables = prev.tables.map((table: any) => {
          if (table.id === tableId) {
            // Actualizar la posición base de la tabla
            return { 
              ...table, 
              position: { ...table.position, x: newPosition.x, y: newPosition.y }
            };
          }
          return table;
        });
      }
      
      return newTemplate;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');

      const result = await window.electronAPI.updateFormTemplate(
        template.id,
        user.id,
        {
          staticElements: template.staticElements,
          fields: template.fields,
          tables: template.tables,
          pageSize: template.pageSize
        }
      );

      if (result.success) {
        setNotification({ message: 'Cambios guardados correctamente', type: 'success' });
      } else {
        setNotification({ message: `Error al guardar: ${result.error}`, type: 'error' });
      }
    } catch (err: any) {
      console.error('Error al guardar:', err);
      setNotification({ message: 'Error al guardar los cambios', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = async () => {
    // Inyectar una imagen de fondo temporal dentro del canvas para asegurar impresión
    const prev = showBackground;
    if (!prev) setShowBackground(true);
    await new Promise(requestAnimationFrame);
    const canvas = document.querySelector('.form-canvas') as HTMLElement | null;
    let injectedImg: HTMLImageElement | null = null;
    if (canvas && template?.backgroundImage) {
      injectedImg = document.createElement('img');
      injectedImg.src = template.backgroundImage;
      injectedImg.alt = 'bg-print';
      injectedImg.style.position = 'absolute';
      injectedImg.style.inset = '0';
      injectedImg.style.width = '100%';
      injectedImg.style.height = '100%';
      injectedImg.style.objectFit = 'contain';
      injectedImg.style.pointerEvents = 'none';
      injectedImg.style.zIndex = '0';
      // Asegurar que el contenedor apile por encima
      (canvas.style as any).position = canvas.style.position || 'relative';
      canvas.prepend(injectedImg);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      await window.electronAPI.printWithBackground({ silent: false, landscape: false });
    } finally {
      if (injectedImg && injectedImg.parentElement) injectedImg.parentElement.removeChild(injectedImg);
      if (!prev) setShowBackground(false);
    }
  };

  if (loading) {
    return (
      <div className="editor-container">
        <div className="loading-screen">
          <div className="spinner"></div>
          <p>Cargando formulario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="editor-container">
        <div className="error-screen">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <div className="editor-container">
      {/* Barra de herramientas */}
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/dashboard')}
          >
            ← Volver
          </button>
          <h2 className="template-title">{template.name}</h2>
        </div>

        <div className="toolbar-center">
          <label className="toggle-switch">
            <input 
              type="checkbox"
              checked={showBackground}
              onChange={(e) => setShowBackground(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Mostrar imagen de fondo</span>
          </label>

          <label className="toggle-switch">
            <input 
              type="checkbox"
              checked={isDragMode}
              onChange={(e) => setIsDragMode(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">Modo arrastrar</span>
          </label>

          <button 
            className={`btn btn-secondary ${showPropertiesPanel ? 'active' : ''}`}
            onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
          >
            {showPropertiesPanel ? '🎨 Ocultar' : '🎨 Mostrar'} Propiedades
          </button>
        </div>

        <div className="toolbar-right">
          <button 
            className="btn"
            onClick={() => navigate(`/api-config/${id}`)}
            title="Configurar API y numeración automática"
            style={{ background: '#2196F3', color: 'white' }}
          >
            ⚙️ API/Numeración
          </button>
          <button 
            className="btn btn-success"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Guardando...' : '💾 Guardar'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={handlePrint}
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {/* Área de trabajo */}
      <div className="editor-workspace">
        <FormRenderer 
          template={template}
          showBackground={showBackground}
          onElementClick={handleElementClick}
          selectedElement={selectedElement}
          onPositionChange={handlePositionChange}
          isDragMode={isDragMode}
        />

        {showPropertiesPanel && (
          <PropertiesPanel 
            selectedElement={selectedElement}
            template={template}
            onUpdateElement={handleUpdateElement}
            onClose={() => setShowPropertiesPanel(false)}
          />
        )}
      </div>

      {/* Información flotante */}
      {isDragMode && (
        <div className="selection-info">
          🖱️ Modo arrastrar activado - Arrastra los campos para reposicionarlos
        </div>
      )}
      {!isDragMode && selectedElement && (
        <div className="selection-info">
          {selectedElement.type === 'static' && '📝 Elemento estático seleccionado'}
          {selectedElement.type === 'field' && '📋 Campo editable seleccionado'}
          {selectedElement.type === 'table' && '📊 Campo de tabla seleccionado'}
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

export default FormEditorVisual;

