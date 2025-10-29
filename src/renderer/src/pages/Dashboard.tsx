import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const Dashboard: React.FC = () => {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ buffer: ArrayBuffer; type: string } | null>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, [user]);

  const loadTemplates = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await window.electronAPI.getUserFormTemplates(user.id);
      if (result.success) {
        setTemplates(result.templates);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFile = async () => {
    try {
      const fileData = await window.electronAPI.selectFile();
      
      if (fileData) {
        setSelectedFile(fileData);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUploadDocument = async () => {
    if (!user || !selectedFile) return;

    if (!templateName.trim()) {
      setError('Por favor, ingresa un nombre para el formulario');
      return;
    }

    try {
      setUploadLoading(true);
      setUploadProgress('Analizando documento con IA...');

      const result = await window.electronAPI.createFormTemplate(
        templateName,
        templateDescription || undefined,
        user.id,
        selectedFile.buffer,
        selectedFile.type
      );

      if (result.success) {
        setUploadProgress('¡Documento procesado exitosamente!');
        await loadTemplates();
        setTimeout(() => {
          setShowUploadModal(false);
          setUploadProgress('');
          setTemplateName('');
          setTemplateDescription('');
          setSelectedFile(null);
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!uploadLoading) {
      setShowUploadModal(false);
      setTemplateName('');
      setTemplateDescription('');
      setSelectedFile(null);
      setUploadProgress('');
      setError('');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!user) return;
    
    if (!confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteFormTemplate(id, user.id);
      if (result.success) {
        await loadTemplates();
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOpenTemplate = (id: string) => {
    navigate(`/form/${id}`);
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Mis Formularios</h1>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={handleSettings}>
              ⚙️ Configuración
            </button>
            <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
              + Nuevo Formulario
            </button>
            <button className="btn btn-secondary" onClick={logout}>
              🚪 Cerrar sesión
            </button>
          </div>
        </div>
        {user && <p className="user-info">Bienvenido, {user.username}</p>}
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : templates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h2>No tienes formularios todavía</h2>
          <p>Crea tu primer formulario subiendo un documento</p>
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            + Subir Documento
          </button>
        </div>
      ) : (
        <div className="templates-grid">
          {templates.map((template) => (
            <div key={template.id} className="template-card">
              <div className="template-icon">📋</div>
              <div className="template-info">
                <h3>{template.name}</h3>
                {template.description && <p>{template.description}</p>}
                <span className="template-date">
                  Creado: {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="template-actions">
                <button
                  className="btn btn-primary btn-small"
                  onClick={() => handleOpenTemplate(template.id)}
                >
                  Abrir
                </button>
                <button
                  className="btn btn-success btn-small"
                  onClick={() => navigate(`/editor/${template.id}`)}
                  title="Editor Visual - Editar estructura y estilos"
                >
                  🎨 Editar
                </button>
                <button
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteTemplate(template.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Crear Nuevo Formulario</h2>
            <p>
              Selecciona una <strong>imagen</strong> (JPG, PNG, GIF, WebP) del formulario que deseas recrear.
              La IA analizará la imagen y detectará automáticamente los campos.
            </p>
            <div style={{ 
              fontSize: '0.85rem', 
              background: '#fef3c7', 
              border: '1px solid #fbbf24',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginTop: '0.5rem'
            }}>
              <strong>💡 Para PDFs:</strong> Abre el PDF, toma una captura de pantalla (Win + Shift + S), guárdala como imagen y súbela aquí.
            </div>
            
            {uploadProgress && (
              <div className="upload-progress">
                <div className="spinner"></div>
                <p>{uploadProgress}</p>
              </div>
            )}

            {!uploadLoading && (
              <div className="form-group">
                <label htmlFor="templateName">Nombre del formulario *</label>
                <input
                  id="templateName"
                  type="text"
                  className="input"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Formulario de Solicitud 2025"
                  disabled={uploadLoading}
                />
              </div>
            )}

            {!uploadLoading && (
              <div className="form-group">
                <label htmlFor="templateDescription">Descripción (opcional)</label>
                <textarea
                  id="templateDescription"
                  className="input"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Describe para qué es este formulario..."
                  disabled={uploadLoading}
                  rows={2}
                />
              </div>
            )}

            {!uploadLoading && selectedFile && (
              <div className="success-message">
                ✓ Archivo seleccionado: {selectedFile.type === 'pdf' ? 'PDF' : 'Imagen'}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={handleCloseModal}
                disabled={uploadLoading}
              >
                Cancelar
              </button>
              {!selectedFile ? (
                <button
                  className="btn btn-primary"
                  onClick={handleSelectFile}
                  disabled={uploadLoading}
                >
                  Seleccionar Documento
                </button>
              ) : (
                <button
                  className="btn btn-success"
                  onClick={handleUploadDocument}
                  disabled={uploadLoading || !templateName.trim()}
                >
                  Crear Formulario
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

