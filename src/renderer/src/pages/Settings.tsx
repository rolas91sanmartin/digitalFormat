import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const key = await window.electronAPI.getApiKey();
      setApiKey(key || '');
    } catch (error) {
      console.error('Error al cargar configuración:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setMessage({ type: 'error', text: 'Por favor, ingresa tu API Key' });
      return;
    }

    try {
      setSaving(true);
      await window.electronAPI.setApiKey(apiKey);
      setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
      
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Error al guardar configuración' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-content">
        <div className="settings-header">
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            ← Volver
          </button>
          <h1>Configuración</h1>
        </div>

        <div className="settings-card">
          <div className="settings-section">
            <h2>API Key de OpenAI</h2>
            <p className="settings-description">
              Para usar la funcionalidad de reconocimiento de documentos, necesitas una API Key de OpenAI.
              Puedes obtener una en{' '}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                platform.openai.com
              </a>
            </p>

            {message && (
              <div className={message.type === 'success' ? 'success-message' : 'error-message'}>
                {message.text}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="apiKey">OpenAI API Key</label>
              <input
                id="apiKey"
                type="password"
                className="input"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>

          <div className="settings-section">
            <h2>Información</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Versión:</strong>
                <span>1.0.0</span>
              </div>
              <div className="info-item">
                <strong>Desarrollado por:</strong>
                <span>rolas91sanmartin</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h2>¿Cómo funciona?</h2>
            <ol className="instructions-list">
              <li>Configura tu API Key de OpenAI arriba</li>
              <li>Sube un documento (PDF o imagen) desde el Dashboard</li>
              <li>La IA analizará el documento y detectará los campos automáticamente</li>
              <li>Rellena los campos en el editor de formularios</li>
              <li>Imprime el formulario completo con tu impresora por defecto</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

