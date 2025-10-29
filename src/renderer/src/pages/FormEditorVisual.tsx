import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormRenderer from '../components/FormRenderer';
import PropertiesPanel from '../components/PropertiesPanel';
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
        alert('✅ Cambios guardados correctamente');
      } else {
        alert('❌ Error al guardar: ' + result.error);
      }
    } catch (err: any) {
      console.error('Error al guardar:', err);
      alert('❌ Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
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

          <button 
            className={`btn btn-secondary ${showPropertiesPanel ? 'active' : ''}`}
            onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
          >
            {showPropertiesPanel ? '🎨 Ocultar' : '🎨 Mostrar'} Propiedades
          </button>
        </div>

        <div className="toolbar-right">
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
      {selectedElement && (
        <div className="selection-info">
          {selectedElement.type === 'static' && '📝 Elemento estático seleccionado'}
          {selectedElement.type === 'field' && '📋 Campo editable seleccionado'}
          {selectedElement.type === 'table' && '📊 Tabla seleccionada'}
        </div>
      )}
    </div>
  );
};

export default FormEditorVisual;

