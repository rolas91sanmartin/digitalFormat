import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Notification from '../components/Notification';
import Swal from 'sweetalert2';
import '../styles/sweetalert-custom.css';
import './Dashboard.css';

declare global {
  interface Window {
    electronAPI: any;
  }
}

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
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
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
    
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta plantilla? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      const deleteResult = await window.electronAPI.deleteFormTemplate(id, user.id);
      if (deleteResult.success) {
        setNotification({ message: 'Plantilla eliminada correctamente', type: 'success' });
        await loadTemplates();
      } else {
        setNotification({ message: `Error al eliminar: ${deleteResult.error}`, type: 'error' });
      }
    } catch (err: any) {
      setNotification({ message: `Error: ${err.message}`, type: 'error' });
    }
  };

  const handleOpenTemplate = (id: string) => {
    navigate(`/form/${id}`);
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleExportTemplate = async (templateId: string) => {
    try {
      console.log('Exportando template:', templateId);
      
      // Obtener el template completo
      const result = await window.electronAPI.getFormTemplate(templateId);
      
      if (!result.success || !result.template) {
        setNotification({ message: 'Error al obtener el template', type: 'error' });
        console.error('Error obteniendo template:', result);
        return;
      }

      const template = result.template;
      console.log('Template obtenido:', template);
      
      // Crear el objeto de exportación con valores por defecto
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        template: {
          name: template.name || 'Sin nombre',
          description: template.description || '',
          backgroundImage: template.backgroundImage || '',
          fields: template.fields || [],
          tables: template.tables || [],
          staticElements: template.staticElements || [],
          pageSize: template.pageSize || { width: 794, height: 1123 },
          renderMode: template.renderMode || 'hybrid'
        }
      };

      console.log('Datos a exportar:', exportData);

      // Convertir a JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      console.log('JSON generado, tamaño:', jsonString.length, 'bytes');
      
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // Crear un link temporal para descargar
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `${(template.name || 'template').replace(/[^a-z0-9]/gi, '_')}_config.json`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('Archivo descargado:', fileName);
      setNotification({ message: `Configuración exportada correctamente como: ${fileName}`, type: 'success' });
    } catch (err: any) {
      console.error('Error detallado al exportar:', err);
      setNotification({ message: `Error al exportar la configuración: ${err.message || 'Error desconocido'}`, type: 'error' });
    }
  };

  const handleImportTemplate = async () => {
    try {
      // Crear un input file temporal
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          console.log('Leyendo archivo:', file.name);
          const text = await file.text();
          console.log('Contenido del archivo:', text);
          
          let importData;
          try {
            importData = JSON.parse(text);
            console.log('Datos parseados:', importData);
          } catch (parseError) {
            console.error('Error al parsear JSON:', parseError);
            setNotification({ message: 'El archivo no es un JSON válido. Asegúrate de seleccionar un archivo exportado correctamente.', type: 'error' });
            return;
          }

          // Validar estructura básica
          if (!importData || typeof importData !== 'object') {
            setNotification({ message: 'Archivo de configuración inválido: estructura incorrecta', type: 'error' });
            return;
          }

          // Verificar si tiene la estructura de exportación
          if (!importData.template) {
            setNotification({ message: 'Archivo de configuración inválido: no contiene datos de template', type: 'error' });
            return;
          }

          // Validar campos requeridos
          if (!importData.template.name) {
            setNotification({ message: 'Archivo de configuración inválido: falta el nombre del template', type: 'error' });
            return;
          }

          if (!user) {
            setNotification({ message: 'Debes estar autenticado', type: 'error' });
            return;
          }

          console.log('Importando template:', importData.template.name);

          // Crear el template importado
          const result = await window.electronAPI.importFormTemplate(
            user.id,
            importData.template
          );

          if (result.success) {
            setNotification({ message: 'Configuración importada correctamente', type: 'success' });
            await loadTemplates();
          } else {
            setNotification({ message: `Error al importar: ${result.error}`, type: 'error' });
          }
        } catch (err: any) {
          console.error('Error detallado al importar:', err);
          setNotification({ message: `Error al leer el archivo de configuración: ${err.message || 'Error desconocido'}`, type: 'error' });
        }
      };

      input.click();
    } catch (err: any) {
      console.error('Error al abrir selector de archivo:', err);
      setNotification({ message: `Error al abrir selector de archivo: ${err.message || 'Error desconocido'}`, type: 'error' });
    }
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
            <button className="btn btn-success" onClick={handleImportTemplate}>
              📥 Importar Configuración
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
                  onClick={() => handleExportTemplate(template.id)}
                  title="Exportar configuración"
                >
                  📤 Exportar
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

export default Dashboard;

