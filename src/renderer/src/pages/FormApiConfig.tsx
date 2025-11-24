import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Swal from 'sweetalert2';
import './Dashboard.css';

const FormApiConfig: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Configuración de API
  const [apiEnabled, setApiEnabled] = useState(false);
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiMethod, setApiMethod] = useState<'POST' | 'PUT' | 'PATCH'>('POST');
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'apikey' | 'basic'>('none');
  const [bearerToken, setBearerToken] = useState('');
  const [apiKeyHeader, setApiKeyHeader] = useState('X-API-Key');
  const [apiKeyValue, setApiKeyValue] = useState('');
  const [basicUsername, setBasicUsername] = useState('');
  const [basicPassword, setBasicPassword] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([]);

  // Configuración de numeración
  const [numerationEnabled, setNumerationEnabled] = useState(false);
  const [numerationSource, setNumerationSource] = useState<'local' | 'api' | 'api-response'>('local'); // ⭐ Tres modos
  const [numerationType, setNumerationType] = useState<'sequential' | 'date-based'>('sequential');
  const [numerationPrefix, setNumerationPrefix] = useState('');
  const [numerationSuffix, setNumerationSuffix] = useState('');
  const [numerationPadding, setNumerationPadding] = useState(5);
  const [numerationStartFrom, setNumerationStartFrom] = useState(1);
  const [numerationFieldId, setNumerationFieldId] = useState('');
  
  // ⭐ NUEVO: Configuración para folio desde API externa
  const [folioApiEndpoint, setFolioApiEndpoint] = useState('');
  const [folioApiMethod, setFolioApiMethod] = useState<'GET' | 'POST'>('GET');
  const [folioApiHeaders, setFolioApiHeaders] = useState<Array<{ key: string; value: string }>>([]);
  const [folioAuthType, setFolioAuthType] = useState<'none' | 'bearer' | 'apikey' | 'basic'>('none');
  const [folioAuthToken, setFolioAuthToken] = useState('');
  const [folioApiKeyHeader, setFolioApiKeyHeader] = useState('X-API-Key');
  const [folioApiKeyValue, setFolioApiKeyValue] = useState('');
  const [folioBasicUsername, setFolioBasicUsername] = useState('');
  const [folioBasicPassword, setFolioBasicPassword] = useState('');
  const [folioApiTimeout, setFolioApiTimeout] = useState(10000);
  const [folioResponsePath, setFolioResponsePath] = useState('');
  const [folioApiPayload, setFolioApiPayload] = useState('');
  
  // ⭐ NUEVO: Configuración para folio desde API Response
  const [apiResponseFolioPath, setApiResponseFolioPath] = useState('');

  // Field mappings
  const [fieldMappings, setFieldMappings] = useState<any[]>([]);
  
  // Formato de datos y mapeo de tablas
  const [dataFormat, setDataFormat] = useState<'structured' | 'flat' | 'custom'>('structured');
  const [tableMappings, setTableMappings] = useState<any[]>([]);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  
  // Próximo número de secuencia
  const [nextSequenceNumber, setNextSequenceNumber] = useState<number>(1);

  useEffect(() => {
    loadTemplate();
  }, [id]);

  const loadTemplate = async () => {
    if (!id) return;

    try {
      const response = await window.electronAPI.getFormTemplateById(id);
      if (response.success) {
        const tmpl = response.template;
        setTemplate(tmpl);

        // Cargar configuración existente
        if (tmpl.apiConfiguration) {
          const api = tmpl.apiConfiguration;
          setApiEnabled(api.enabled);
          setApiEndpoint(api.endpoint || '');
          setApiMethod(api.method || 'POST');
          setAuthType(api.authentication?.type || 'none');
          setBearerToken(api.authentication?.token || '');
          setApiKeyHeader(api.authentication?.apiKeyHeader || 'X-API-Key');
          setApiKeyValue(api.authentication?.apiKey || '');
          setBasicUsername(api.authentication?.username || '');
          setBasicPassword(api.authentication?.password || '');
          setDataFormat(api.dataFormat || 'structured');
          
          // Cargar headers personalizados
          if (api.headers && typeof api.headers === 'object') {
            const headersArray = Object.entries(api.headers).map(([key, value]) => ({
              key,
              value: String(value)
            }));
            setCustomHeaders(headersArray);
          }
        }

        if (tmpl.numerationConfig) {
          const num = tmpl.numerationConfig;
          setNumerationEnabled(num.enabled);
          setNumerationSource(num.source || 'local'); // ⭐ NUEVO
          setNumerationType(num.type || 'sequential');
          setNumerationPrefix(num.prefix || '');
          setNumerationSuffix(num.suffix || '');
          setNumerationPadding(num.padding || 5);
          setNumerationStartFrom(num.startFrom || 1);
          setNumerationFieldId(num.fieldId || '');
          
          // ⭐ NUEVO: Cargar configuración de API externa
          if (num.source === 'api') {
            setFolioApiEndpoint(num.apiEndpoint || '');
            setFolioApiMethod(num.apiMethod || 'GET');
            setFolioAuthType(num.apiAuthentication?.type || 'none');
            setFolioAuthToken(num.apiAuthentication?.token || '');
            setFolioApiKeyHeader(num.apiAuthentication?.apiKeyHeader || 'X-API-Key');
            setFolioApiKeyValue(num.apiAuthentication?.apiKey || '');
            setFolioBasicUsername(num.apiAuthentication?.username || '');
            setFolioBasicPassword(num.apiAuthentication?.password || '');
            setFolioApiTimeout(num.apiTimeout || 10000);
            setFolioResponsePath(num.apiResponsePath || '');
            
            // Cargar payload (si es JSON string, parsearlo)
            if (num.apiPayload) {
              const payloadStr = typeof num.apiPayload === 'string' 
                ? num.apiPayload 
                : JSON.stringify(num.apiPayload, null, 2);
              setFolioApiPayload(payloadStr);
            }
            
            // Cargar headers personalizados para folio API
            if (num.apiHeaders && typeof num.apiHeaders === 'object') {
              const headersArray = Object.entries(num.apiHeaders).map(([key, value]) => ({
                key,
                value: String(value)
              }));
              setFolioApiHeaders(headersArray);
            }
          }
          
          // ⭐ NUEVO: Cargar configuración de API Response
          if (num.source === 'api-response') {
            setApiResponseFolioPath(num.apiResponseFolioPath || '');
          }
        }

        if (tmpl.fieldMappings) {
          setFieldMappings(tmpl.fieldMappings);
        } else {
          // Inicializar mapeos con campos del template
          const initialMappings = tmpl.fields?.map((field: any) => ({
            fieldId: field.id,
            apiKey: field.name.toLowerCase().replace(/\s+/g, '_'),
            transform: { type: 'none' },
            required: field.required || false,
            defaultValue: ''
          })) || [];
          setFieldMappings(initialMappings);
        }
        
        // Inicializar mapeos de tablas
        console.log('📊 Cargando tableMappings:', tmpl.tableMappings);
        if (tmpl.tableMappings && Array.isArray(tmpl.tableMappings) && tmpl.tableMappings.length > 0) {
          console.log('✅ Usando tableMappings guardados:', tmpl.tableMappings);
          setTableMappings(tmpl.tableMappings);
        } else if (tmpl.tables && tmpl.tables.length > 0) {
          console.log('🔄 Inicializando tableMappings automáticamente');
          // Inicializar mapeos automáticamente para cada tabla
          const initialTableMappings = tmpl.tables.map((table: any) => ({
            tableId: table.id,
            apiKey: table.id.replace(/^table_/, '').toLowerCase(), // Remover prefijo 'table_' si existe
            enabled: true,
            columnMappings: table.columns.map((col: any) => ({
              columnId: col.id,
              apiKey: col.header.toLowerCase().replace(/\s+/g, '_'),
              transform: { type: 'none' }
            }))
          }));
          setTableMappings(initialTableMappings);
        }
        
        // Cargar el próximo número de secuencia
        try {
          const sequenceResult = await window.electronAPI.getNextSequenceNumber(id);
          if (sequenceResult.success) {
            setNextSequenceNumber(sequenceResult.nextNumber);
          }
        } catch (error) {
          console.error('Error cargando secuencia:', error);
        }
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !template) return;

    try {
      // Convertir headers personalizados a objeto
      const headersObject: Record<string, string> = {};
      customHeaders.forEach(header => {
        if (header.key.trim() && header.value.trim()) {
          headersObject[header.key.trim()] = header.value.trim();
        }
      });
      
      const apiConfiguration = apiEnabled ? {
        enabled: true,
        endpoint: apiEndpoint,
        method: apiMethod,
        headers: headersObject,
        authentication: {
          type: authType,
          ...(authType === 'bearer' && { token: bearerToken }),
          ...(authType === 'apikey' && { apiKeyHeader, apiKey: apiKeyValue }),
          ...(authType === 'basic' && { username: basicUsername, password: basicPassword })
        },
        dataFormat,
        beforeSend: { validateRequired: true },
        onSuccess: { showMessage: true, message: '¡Formulario enviado correctamente!', clearForm: false },
        onError: { showMessage: true, message: 'Error al enviar formulario', retryable: true },
        timeout: 30000
      } : undefined;

      // ⭐ NUEVO: Construir configuración de numeración con soporte para API externa
      let numerationConfig = undefined;
      if (numerationEnabled) {
        // Configuración base
        numerationConfig = {
          enabled: true,
          source: numerationSource,
          type: numerationType,
          prefix: numerationPrefix,
          suffix: numerationSuffix,
          padding: numerationPadding,
          fieldId: numerationFieldId,
          autoIncrement: true,
          startFrom: numerationStartFrom
        };
        
        // Si el origen es API externa, agregar configuración adicional
        if (numerationSource === 'api') {
          // Convertir headers de folio API a objeto
          const folioHeadersObject: Record<string, string> = {};
          folioApiHeaders.forEach(header => {
            if (header.key.trim() && header.value.trim()) {
              folioHeadersObject[header.key.trim()] = header.value.trim();
            }
          });
          
          // Parsear payload si es JSON string
          let parsedPayload = undefined;
          if (folioApiPayload && folioApiPayload.trim()) {
            try {
              parsedPayload = JSON.parse(folioApiPayload);
            } catch (e) {
              Swal.fire('Error', 'El payload del API de folio debe ser un JSON válido', 'error');
              return;
            }
          }
          
          numerationConfig = {
            ...numerationConfig,
            apiEndpoint: folioApiEndpoint,
            apiMethod: folioApiMethod,
            apiHeaders: folioHeadersObject,
            apiAuthentication: {
              type: folioAuthType,
              ...(folioAuthType === 'bearer' && { token: folioAuthToken }),
              ...(folioAuthType === 'apikey' && { 
                apiKeyHeader: folioApiKeyHeader, 
                apiKey: folioApiKeyValue 
              }),
              ...(folioAuthType === 'basic' && { 
                username: folioBasicUsername, 
                password: folioBasicPassword 
              })
            },
            apiTimeout: folioApiTimeout,
            apiResponsePath: folioResponsePath,
            ...(parsedPayload && { apiPayload: parsedPayload })
          };
        }
        
        // ⭐ NUEVO: Si el origen es API Response (respuesta de API de guardado)
        if (numerationSource === 'api-response') {
          if (!apiEnabled) {
            Swal.fire('Error', 'Debe habilitar la configuración de API para usar este modo de folio', 'error');
            return;
          }
          if (!apiResponseFolioPath.trim()) {
            Swal.fire('Error', 'Debe especificar el path del folio en la respuesta de la API', 'error');
            return;
          }
          numerationConfig = {
            ...numerationConfig,
            apiResponseFolioPath: apiResponseFolioPath.trim()
          };
        }
      }

      console.log('💾 Guardando tableMappings:', tableMappings);
      console.log('💾 Guardando custom headers:', headersObject);
      console.log('💾 API habilitada:', apiEnabled);
      
      const response = await window.electronAPI.updateFormTemplate(template.id, user.id, {
        apiConfiguration,
        numerationConfig,
        fieldMappings: apiEnabled ? fieldMappings : undefined,
        tableMappings: apiEnabled ? tableMappings : undefined
      });
      
      console.log('✅ Respuesta del guardado:', response);

      if (response.success) {
        await Swal.fire('¡Guardado!', 'Configuración actualizada correctamente', 'success');
        navigate('/dashboard');
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      Swal.fire('Error', error.message, 'error');
    }
  };

  const updateFieldMapping = (fieldId: string, key: string, value: any) => {
    setFieldMappings(prev => prev.map(m =>
      m.fieldId === fieldId ? { ...m, [key]: value } : m
    ));
  };

  const updateTableMapping = (tableId: string, key: string, value: any) => {
    setTableMappings(prev => prev.map(m =>
      m.tableId === tableId ? { ...m, [key]: value } : m
    ));
  };

  const updateTableColumnMapping = (tableId: string, columnId: string, key: string, value: any) => {
    setTableMappings(prev => prev.map(m => {
      if (m.tableId !== tableId) return m;
      return {
        ...m,
        columnMappings: m.columnMappings.map((cm: any) =>
          cm.columnId === columnId ? { ...cm, [key]: value } : cm
        )
      };
    }));
  };

  // Funciones para manejar headers personalizados
  const addCustomHeader = () => {
    setCustomHeaders(prev => [...prev, { key: '', value: '' }]);
  };

  const updateCustomHeader = (index: number, field: 'key' | 'value', value: string) => {
    setCustomHeaders(prev => prev.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    ));
  };

  const removeCustomHeader = (index: number) => {
    setCustomHeaders(prev => prev.filter((_, i) => i !== index));
  };

  // ⭐ NUEVO: Funciones para manejar headers de API de folio
  const addFolioApiHeader = () => {
    setFolioApiHeaders(prev => [...prev, { key: '', value: '' }]);
  };

  const updateFolioApiHeader = (index: number, field: 'key' | 'value', value: string) => {
    setFolioApiHeaders(prev => prev.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    ));
  };

  const removeFolioApiHeader = (index: number) => {
    setFolioApiHeaders(prev => prev.filter((_, i) => i !== index));
  };

  const generateJsonPreview = () => {
    if (!template) return {};

    // Datos de ejemplo para la vista previa
    const exampleFieldValues: any = {};
    fieldMappings.forEach(mapping => {
      const field = template.fields?.find((f: any) => f.id === mapping.fieldId);
      if (field) {
        exampleFieldValues[mapping.apiKey] = `ejemplo_${field.name.toLowerCase()}`;
      }
    });

    const exampleTableData: any = {};
    tableMappings.forEach(mapping => {
      if (!mapping.enabled) return;
      const table = template.tables?.find((t: any) => t.id === mapping.tableId);
      if (table) {
        exampleTableData[mapping.apiKey] = [
          mapping.columnMappings.reduce((acc: any, colMapping: any) => {
            const column = table.columns.find((c: any) => c.id === colMapping.columnId);
            acc[colMapping.apiKey] = column ? `ejemplo_${column.header}` : 'ejemplo';
            return acc;
          }, {}),
          mapping.columnMappings.reduce((acc: any, colMapping: any) => {
            const column = table.columns.find((c: any) => c.id === colMapping.columnId);
            acc[colMapping.apiKey] = column ? `ejemplo_${column.header}_2` : 'ejemplo_2';
            return acc;
          }, {})
        ];
      }
    });

    // Construir JSON según el formato seleccionado
    if (dataFormat === 'structured') {
      return {
        metadata: {
          formNumber: getPreviewNumber(),
          templateId: template.id,
          templateName: template.name,
          submittedAt: new Date().toISOString(),
          submittedBy: user?.email || 'user@example.com'
        },
        fields: exampleFieldValues,
        tables: exampleTableData
      };
    } else if (dataFormat === 'flat') {
      return {
        folio: getPreviewNumber(),
        enviado_por: user?.email || 'user@example.com',
        fecha_envio: new Date().toISOString(),
        ...exampleFieldValues,
        ...Object.entries(exampleTableData).reduce((acc, [key, value]) => {
          acc[`${key}_items`] = value;
          return acc;
        }, {} as any)
      };
    } else {
      // custom - por ahora igual que structured
      return {
        metadata: {
          formNumber: getPreviewNumber(),
          templateId: template.id,
          templateName: template.name,
          submittedBy: user?.email || 'user@example.com',
          submittedAt: new Date().toISOString()
        },
        fields: exampleFieldValues,
        tables: exampleTableData
      };
    }
  };

  const getPreviewNumber = () => {
    const num = nextSequenceNumber.toString().padStart(numerationPadding, '0');
    if (numerationType === 'sequential') {
      return `${numerationPrefix}${num}${numerationSuffix}`;
    } else {
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      return `${numerationPrefix}${date}-${num}${numerationSuffix}`;
    }
  };

  if (loading) {
    return <div className="dashboard-container"><p>Cargando...</p></div>;
  }

  if (!template) {
    return <div className="dashboard-container"><p>Plantilla no encontrada</p></div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Configurar API y Numeración</h1>
        <p>{template.name}</p>
      </div>

      <div className="dashboard-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Configuración de API */}
        <div style={{ marginBottom: '30px', padding: '20px', background: 'white', borderRadius: '8px' }}>
          <h2>Integración con API</h2>
          <label style={{ display: 'block', marginBottom: '15px' }}>
            <input 
              type="checkbox" 
              checked={apiEnabled}
              onChange={(e) => setApiEnabled(e.target.checked)}
            />
            {' '}Enviar datos a API externa
          </label>

          {apiEnabled && (
            <>
              <div style={{ marginBottom: '15px' }}>
                <label>Endpoint URL:</label>
                <input 
                  type="url"
                  className="input"
                  placeholder="https://api.tuservicio.com/formularios"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>Método:</label>
                <select 
                  className="input"
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as any)}
                >
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="PATCH">PATCH</option>
                </select>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label>Autenticación:</label>
                <select 
                  className="input"
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as any)}
                >
                  <option value="none">Sin autenticación</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="apikey">API Key</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>

              {authType === 'bearer' && (
                <div style={{ marginBottom: '15px' }}>
                  <label>Token:</label>
                  <input 
                    type="text"
                    className="input"
                    placeholder="your-bearer-token"
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              {authType === 'apikey' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label>Nombre del Header:</label>
                    <input 
                      type="text"
                      className="input"
                      placeholder="X-API-Key"
                      value={apiKeyHeader}
                      onChange={(e) => setApiKeyHeader(e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label>API Key:</label>
                    <input 
                      type="text"
                      className="input"
                      placeholder="your-api-key"
                      value={apiKeyValue}
                      onChange={(e) => setApiKeyValue(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>
                </>
              )}

              {authType === 'basic' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label>Usuario:</label>
                    <input 
                      type="text"
                      className="input"
                      value={basicUsername}
                      onChange={(e) => setBasicUsername(e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label>Contraseña:</label>
                    <input 
                      type="password"
                      className="input"
                      value={basicPassword}
                      onChange={(e) => setBasicPassword(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Headers Personalizados */}
              <h3 style={{ marginTop: '25px', marginBottom: '15px' }}>Headers / Encabezados Personalizados</h3>
              <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px', fontSize: '13px', color: '#6b7280' }}>
                  Agrega encabezados HTTP personalizados que se enviarán con cada petición (ej: Content-Type, X-Custom-Header, etc.)
                </div>
                
                {customHeaders.map((header, index) => (
                  <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                    <input 
                      type="text"
                      className="input"
                      placeholder="Nombre del header (ej: Content-Type)"
                      value={header.key}
                      onChange={(e) => updateCustomHeader(index, 'key', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <input 
                      type="text"
                      className="input"
                      placeholder="Valor (ej: application/json)"
                      value={header.value}
                      onChange={(e) => updateCustomHeader(index, 'value', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button 
                      onClick={() => removeCustomHeader(index)}
                      style={{ 
                        padding: '8px 12px', 
                        background: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      title="Eliminar header"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                
                <button 
                  onClick={addCustomHeader}
                  style={{ 
                    marginTop: '10px',
                    padding: '8px 16px', 
                    background: '#10b981', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  ➕ Agregar Header
                </button>
                
                {customHeaders.length > 0 && (
                  <div style={{ marginTop: '15px', padding: '12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                    <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '8px' }}>
                      <strong>💡 Headers comunes:</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#1e40af', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div>• <code style={{ background: 'white', padding: '2px 6px', borderRadius: '3px' }}>Content-Type: application/json</code></div>
                      <div>• <code style={{ background: 'white', padding: '2px 6px', borderRadius: '3px' }}>Accept: application/json</code></div>
                      <div>• <code style={{ background: 'white', padding: '2px 6px', borderRadius: '3px' }}>X-Custom-Header: valor</code></div>
                    </div>
                  </div>
                )}
              </div>

              <h3 style={{ marginTop: '20px', marginBottom: '15px' }}>Formato de Datos</h3>
              <div style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      value="structured"
                      checked={dataFormat === 'structured'}
                      onChange={(e) => setDataFormat(e.target.value as any)}
                      style={{ marginRight: '8px' }}
                    />
                    <strong>Estructurado (Recomendado)</strong>
                  </label>
                  <div style={{ marginLeft: '24px', fontSize: '13px', color: '#6b7280' }}>
                    Separa metadata, fields y tables en objetos diferentes. Ideal para APIs empresariales.
                  </div>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      value="flat"
                      checked={dataFormat === 'flat'}
                      onChange={(e) => setDataFormat(e.target.value as any)}
                      style={{ marginRight: '8px' }}
                    />
                    <strong>Plano</strong>
                  </label>
                  <div style={{ marginLeft: '24px', fontSize: '13px', color: '#6b7280' }}>
                    Todos los datos al mismo nivel. Compatible con APIs legacy simples.
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      value="custom"
                      checked={dataFormat === 'custom'}
                      onChange={(e) => setDataFormat(e.target.value as any)}
                      style={{ marginRight: '8px' }}
                      disabled
                    />
                    <strong>Personalizado</strong>
                    <span style={{ marginLeft: '8px', fontSize: '12px', color: '#9ca3af' }}>(Próximamente)</span>
                  </label>
                  <div style={{ marginLeft: '24px', fontSize: '13px', color: '#6b7280' }}>
                    Define tu propia estructura JSON personalizada.
                  </div>
                </div>
              </div>

              <h3 style={{ marginTop: '20px' }}>Mapeo de Campos</h3>
              <table style={{ width: '100%', marginTop: '10px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Campo</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Nombre en API</th>
                    <th style={{ padding: '8px', textAlign: 'center' }}>Requerido</th>
                  </tr>
                </thead>
                <tbody>
                  {template.fields?.map((field: any) => {
                    const mapping = fieldMappings.find(m => m.fieldId === field.id) || {};
                    return (
                      <tr key={field.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '8px' }}>{field.name}</td>
                        <td style={{ padding: '8px' }}>
                          <input 
                            type="text"
                            className="input"
                            placeholder="field_name"
                            value={mapping.apiKey || ''}
                            onChange={(e) => updateFieldMapping(field.id, 'apiKey', e.target.value)}
                            style={{ width: '100%' }}
                          />
                        </td>
                        <td style={{ padding: '8px', textAlign: 'center' }}>
                          <input 
                            type="checkbox"
                            checked={mapping.required || false}
                            onChange={(e) => updateFieldMapping(field.id, 'required', e.target.checked)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mapeo de Tablas */}
              {template.tables && template.tables.length > 0 && (
                <>
                  <h3 style={{ marginTop: '25px', marginBottom: '10px' }}>Mapeo de Tablas</h3>
                  {tableMappings.map((tableMapping: any) => {
                    const table = template.tables?.find((t: any) => t.id === tableMapping.tableId);
                    if (!table) return null;

                    return (
                      <div key={tableMapping.tableId} style={{ marginBottom: '20px', padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                          <input 
                            type="checkbox"
                            checked={tableMapping.enabled}
                            onChange={(e) => updateTableMapping(tableMapping.tableId, 'enabled', e.target.checked)}
                            style={{ marginRight: '10px' }}
                          />
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '16px' }}>Tabla: {table.id}</strong>
                            <div style={{ marginTop: '5px' }}>
                              <span style={{ fontSize: '13px', color: '#6b7280', marginRight: '8px' }}>Nombre en API:</span>
                              <input 
                                type="text"
                                className="input"
                                placeholder="table_name"
                                value={tableMapping.apiKey || ''}
                                onChange={(e) => updateTableMapping(tableMapping.tableId, 'apiKey', e.target.value)}
                                style={{ width: '300px', display: 'inline-block' }}
                                disabled={!tableMapping.enabled}
                              />
                            </div>
                          </div>
                        </div>

                        {tableMapping.enabled && (
                          <div style={{ marginLeft: '30px' }}>
                            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#374151' }}>
                              Columnas:
                            </div>
                            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                                  <th style={{ padding: '6px', textAlign: 'left', color: '#6b7280' }}>Columna Original</th>
                                  <th style={{ padding: '6px', textAlign: 'left', color: '#6b7280' }}>Nombre en API</th>
                                </tr>
                              </thead>
                              <tbody>
                                {table.columns.map((column: any) => {
                                  const colMapping = tableMapping.columnMappings.find((cm: any) => cm.columnId === column.id);
                                  return (
                                    <tr key={column.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                      <td style={{ padding: '6px' }}>{column.header}</td>
                                      <td style={{ padding: '6px' }}>
                                        <input 
                                          type="text"
                                          className="input"
                                          placeholder="column_name"
                                          value={colMapping?.apiKey || ''}
                                          onChange={(e) => updateTableColumnMapping(tableMapping.tableId, column.id, 'apiKey', e.target.value)}
                                          style={{ width: '100%', padding: '4px 8px', fontSize: '13px' }}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Vista Previa del JSON */}
              <div style={{ marginTop: '25px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0 }}>Vista Previa del JSON</h3>
                  <button 
                    className="btn"
                    onClick={() => setShowJsonPreview(!showJsonPreview)}
                    style={{ fontSize: '14px', padding: '6px 12px' }}
                  >
                    {showJsonPreview ? '👁️ Ocultar' : '👁️ Ver Previa'}
                  </button>
                </div>

                {showJsonPreview && (
                  <div style={{ padding: '15px', background: '#1f2937', borderRadius: '8px', color: '#f3f4f6', fontSize: '13px', fontFamily: 'monospace', maxHeight: '400px', overflow: 'auto' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {JSON.stringify(generateJsonPreview(), null, 2)}
                    </pre>
                  </div>
                )}

                <div style={{ marginTop: '10px', padding: '10px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: '13px', color: '#1e40af' }}>
                    <strong>💡 Nota:</strong> Esta es una vista previa con datos de ejemplo. El JSON real contendrá los valores ingresados en el formulario.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Configuración de Numeración */}
        <div style={{ marginBottom: '30px', padding: '20px', background: 'white', borderRadius: '8px' }}>
          <h2>Numeración Automática</h2>
          <label style={{ display: 'block', marginBottom: '15px' }}>
            <input 
              type="checkbox"
              checked={numerationEnabled}
              onChange={(e) => setNumerationEnabled(e.target.checked)}
            />
            {' '}Generar número de folio automático
          </label>

          {numerationEnabled && (
            <>
              {/* ⭐ NUEVO: Selector de origen del folio */}
              <div style={{ marginBottom: '25px', padding: '15px', background: '#f9fafb', borderRadius: '8px', border: '2px solid #e5e7eb' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', fontSize: '15px' }}>
                  🎯 Origen del Folio:
                </label>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px 15px', background: numerationSource === 'local' ? '#dbeafe' : 'white', border: `2px solid ${numerationSource === 'local' ? '#3b82f6' : '#d1d5db'}`, borderRadius: '6px', flex: 1 }}>
                    <input 
                      type="radio"
                      name="numerationSource"
                      value="local"
                      checked={numerationSource === 'local'}
                      onChange={(e) => setNumerationSource('local')}
                      style={{ marginRight: '8px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>💻 Local</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Generado por este sistema</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px 15px', background: numerationSource === 'api' ? '#dbeafe' : 'white', border: `2px solid ${numerationSource === 'api' ? '#3b82f6' : '#d1d5db'}`, borderRadius: '6px', flex: 1 }}>
                    <input 
                      type="radio"
                      name="numerationSource"
                      value="api"
                      checked={numerationSource === 'api'}
                      onChange={(e) => setNumerationSource('api')}
                      style={{ marginRight: '8px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>🌐 API Externa</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Endpoint dedicado para generar folios</div>
                    </div>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '10px 15px', background: numerationSource === 'api-response' ? '#dbeafe' : 'white', border: `2px solid ${numerationSource === 'api-response' ? '#3b82f6' : '#d1d5db'}`, borderRadius: '6px', flex: 1 }}>
                    <input 
                      type="radio"
                      name="numerationSource"
                      value="api-response"
                      checked={numerationSource === 'api-response'}
                      onChange={(e) => setNumerationSource('api-response')}
                      style={{ marginRight: '8px' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '2px' }}>📡 Respuesta de API</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>Folio retornado por API de guardado</div>
                    </div>
                  </label>
                </div>
                
                <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                  <div style={{ fontSize: '13px', color: '#92400e' }}>
                    <strong>💡 Recomendación:</strong> {numerationSource === 'local' 
                      ? 'Ideal para una sola instalación o cuando no necesitas folios centralizados.' 
                      : numerationSource === 'api'
                      ? 'Perfecto para múltiples instalaciones que requieren folios únicos centralizados.'
                      : 'Usa el folio que tu API de guardado retorna. Requiere tener la API configurada.'}
                  </div>
                </div>
              </div>

              {/* Configuración LOCAL */}
              {numerationSource === 'local' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label>Tipo:</label>
                    <select 
                      className="input"
                      value={numerationType}
                      onChange={(e) => setNumerationType(e.target.value as any)}
                    >
                      <option value="sequential">Secuencial (001, 002, 003...)</option>
                      <option value="date-based">Basado en fecha (20231112-001)</option>
                    </select>
                  </div>
                </>
              )}

              {/* ⭐ NUEVO: Configuración API EXTERNA */}
              {numerationSource === 'api' && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #3b82f6' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#1e40af' }}>🌐 Configuración de API Externa</h3>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label>Endpoint URL: *</label>
                    <input 
                      type="text"
                      className="input"
                      placeholder="https://api.ejemplo.com/generate-folio"
                      value={folioApiEndpoint}
                      onChange={(e) => setFolioApiEndpoint(e.target.value)}
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>Método HTTP:</label>
                    <select 
                      className="input"
                      value={folioApiMethod}
                      onChange={(e) => setFolioApiMethod(e.target.value as 'GET' | 'POST')}
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                    </select>
                  </div>

                  {folioApiMethod === 'POST' && (
                    <div style={{ marginBottom: '15px' }}>
                      <label>Payload (JSON):</label>
                      <textarea 
                        className="input"
                        placeholder='{"templateId": "example"}'
                        value={folioApiPayload}
                        onChange={(e) => setFolioApiPayload(e.target.value)}
                        rows={4}
                        style={{ width: '100%', fontFamily: 'monospace', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '15px' }}>
                    <label>Autenticación:</label>
                    <select 
                      className="input"
                      value={folioAuthType}
                      onChange={(e) => setFolioAuthType(e.target.value as any)}
                    >
                      <option value="none">Sin autenticación</option>
                      <option value="bearer">Bearer Token</option>
                      <option value="apikey">API Key</option>
                      <option value="basic">Basic Auth</option>
                    </select>
                  </div>

                  {folioAuthType === 'bearer' && (
                    <div style={{ marginBottom: '15px' }}>
                      <label>Token:</label>
                      <input 
                        type="password"
                        className="input"
                        placeholder="tu-token-secreto"
                        value={folioAuthToken}
                        onChange={(e) => setFolioAuthToken(e.target.value)}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}

                  {folioAuthType === 'apikey' && (
                    <>
                      <div style={{ marginBottom: '15px' }}>
                        <label>Nombre del Header:</label>
                        <input 
                          type="text"
                          className="input"
                          placeholder="X-API-Key"
                          value={folioApiKeyHeader}
                          onChange={(e) => setFolioApiKeyHeader(e.target.value)}
                        />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label>API Key:</label>
                        <input 
                          type="password"
                          className="input"
                          placeholder="tu-api-key"
                          value={folioApiKeyValue}
                          onChange={(e) => setFolioApiKeyValue(e.target.value)}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </>
                  )}

                  {folioAuthType === 'basic' && (
                    <>
                      <div style={{ marginBottom: '15px' }}>
                        <label>Usuario:</label>
                        <input 
                          type="text"
                          className="input"
                          placeholder="usuario"
                          value={folioBasicUsername}
                          onChange={(e) => setFolioBasicUsername(e.target.value)}
                        />
                      </div>
                      <div style={{ marginBottom: '15px' }}>
                        <label>Contraseña:</label>
                        <input 
                          type="password"
                          className="input"
                          placeholder="contraseña"
                          value={folioBasicPassword}
                          onChange={(e) => setFolioBasicPassword(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div style={{ marginBottom: '15px' }}>
                    <label>Headers Personalizados:</label>
                    {folioApiHeaders.map((header, index) => (
                      <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                        <input 
                          type="text"
                          className="input"
                          placeholder="Header-Name"
                          value={header.key}
                          onChange={(e) => updateFolioApiHeader(index, 'key', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <input 
                          type="text"
                          className="input"
                          placeholder="value"
                          value={header.value}
                          onChange={(e) => updateFolioApiHeader(index, 'value', e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button 
                          className="btn"
                          onClick={() => removeFolioApiHeader(index)}
                          style={{ padding: '0 15px' }}
                        >
                          ❌
                        </button>
                      </div>
                    ))}
                    <button 
                      className="btn"
                      onClick={addFolioApiHeader}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      + Agregar Header
                    </button>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>Timeout (ms):</label>
                    <input 
                      type="number"
                      className="input"
                      min="1000"
                      max="60000"
                      value={folioApiTimeout}
                      onChange={(e) => setFolioApiTimeout(parseInt(e.target.value))}
                    />
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Tiempo máximo de espera para la respuesta del servidor
                    </div>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>Path del Folio en Respuesta: *</label>
                    <input 
                      type="text"
                      className="input"
                      placeholder="data.folio o folioNumber"
                      value={folioResponsePath}
                      onChange={(e) => setFolioResponsePath(e.target.value)}
                      style={{ width: '100%' }}
                    />
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Ruta en el JSON de respuesta donde se encuentra el folio (ej: "data.folio" o "folioNumber")
                    </div>
                  </div>

                  <div style={{ padding: '12px', background: '#fef3c7', borderRadius: '6px', border: '1px solid #fbbf24' }}>
                    <div style={{ fontSize: '13px', color: '#92400e' }}>
                      <strong>📝 Ejemplo de respuesta esperada:</strong><br/>
                      <code style={{ display: 'block', marginTop: '5px', padding: '8px', background: 'white', borderRadius: '4px', fontSize: '12px' }}>
                        {`{ "data": { "folio": "FORM-00123" } }`}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {/* ⭐ NUEVO: Configuración API RESPONSE */}
              {numerationSource === 'api-response' && (
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #10b981' }}>
                  <h3 style={{ marginTop: 0, marginBottom: '15px', color: '#065f46' }}>📡 Configuración de Folio desde Respuesta</h3>
                  
                  <div style={{ marginBottom: '15px', padding: '12px', background: '#dbeafe', borderRadius: '6px', border: '1px solid #3b82f6' }}>
                    <div style={{ fontSize: '13px', color: '#1e40af', marginBottom: '8px' }}>
                      <strong>ℹ️ Cómo funciona:</strong>
                    </div>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1e40af' }}>
                      <li>El usuario imprime el formulario</li>
                      <li>Los datos se envían a la API configurada arriba</li>
                      <li>La API procesa, guarda y responde con un folio</li>
                      <li>El folio se extrae y se muestra en el campo configurado</li>
                      <li>El documento se imprime con ese folio</li>
                    </ol>
                  </div>
                  
                  {!apiEnabled && (
                    <div style={{ marginBottom: '15px', padding: '12px', background: '#fee2e2', borderRadius: '6px', border: '1px solid #ef4444' }}>
                      <div style={{ fontSize: '13px', color: '#991b1b' }}>
                        <strong>⚠️ Advertencia:</strong> Debes habilitar y configurar la API de guardado arriba para usar este modo.
                      </div>
                    </div>
                  )}
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label>Path del Folio en Respuesta: *</label>
                    <input 
                      type="text"
                      className="input"
                      placeholder="data.folio o id o folio"
                      value={apiResponseFolioPath}
                      onChange={(e) => setApiResponseFolioPath(e.target.value)}
                      style={{ width: '100%' }}
                      disabled={!apiEnabled}
                    />
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                      Ruta en el JSON de respuesta donde se encuentra el folio (ej: "data.folio", "id", "folioNumber")
                    </div>
                  </div>
                  
                  <div style={{ padding: '12px', background: 'white', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                    <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                      <strong>📝 Ejemplo de respuesta esperada:</strong>
                    </div>
                    <code style={{ display: 'block', padding: '8px', background: '#f3f4f6', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
{`{
  "success": true,
  "message": "Formulario guardado",
  "data": {
    "folio": "ORD-00145",
    "timestamp": "2024-11-24T10:30:00Z"
  }
}`}
                    </code>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '6px' }}>
                      Para este ejemplo, el path sería: <code style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '3px' }}>data.folio</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración común para ambos modos */}
              {numerationSource === 'local' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <div>
                      <label>Prefijo:</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="FORM-"
                        value={numerationPrefix}
                        onChange={(e) => setNumerationPrefix(e.target.value)}
                      />
                    </div>
                    <div>
                      <label>Sufijo:</label>
                      <input 
                        type="text"
                        className="input"
                        placeholder="-2024"
                        value={numerationSuffix}
                        onChange={(e) => setNumerationSuffix(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              {numerationSource === 'local' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label>Cantidad de ceros (padding):</label>
                    <input 
                      type="number"
                      className="input"
                      min="1"
                      max="10"
                      value={numerationPadding}
                      onChange={(e) => setNumerationPadding(parseInt(e.target.value))}
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label>Iniciar desde:</label>
                    <input 
                      type="number"
                      className="input"
                      min="1"
                      value={numerationStartFrom}
                      onChange={(e) => setNumerationStartFrom(parseInt(e.target.value))}
                    />
                  </div>
                </>
              )}

              {/* Campo selector (común para ambos modos) */}
              <div style={{ marginBottom: '15px' }}>
                <label>Campo donde mostrar el folio: *</label>
                <select 
                  className="input"
                  value={numerationFieldId}
                  onChange={(e) => setNumerationFieldId(e.target.value)}
                >
                  <option value="">Seleccionar campo...</option>
                  {template.fields?.map((field: any) => (
                    <option key={field.id} value={field.id}>{field.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                  El folio se mostrará en este campo del formulario
                </div>
              </div>

              {/* Vista previa del folio */}
              <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '5px', marginTop: '15px', border: '2px solid #2196F3' }}>
                <div style={{ marginBottom: '8px', color: '#0369a1', fontSize: '14px' }}>
                  <strong>📋 Próximo folio:</strong>
                </div>
                {numerationSource === 'local' ? (
                  <>
                    <div style={{ fontSize: '24px', color: '#2196F3', fontWeight: 'bold', letterSpacing: '1px' }}>
                      {getPreviewNumber()}
                    </div>
                    <div style={{ marginTop: '8px', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                      * Este será el número del próximo formulario impreso
                    </div>
                  </>
                ) : numerationSource === 'api' ? (
                  <>
                    <div style={{ fontSize: '18px', color: '#2196F3', fontWeight: 'bold' }}>
                      🌐 Folio generado por API Externa
                    </div>
                    <div style={{ marginTop: '8px', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                      * El folio será obtenido desde: {folioApiEndpoint || '(configurar endpoint)'}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '18px', color: '#10b981', fontWeight: 'bold' }}>
                      📡 Folio de Respuesta de API
                    </div>
                    <div style={{ marginTop: '8px', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                      * El folio será extraído de la respuesta del API de guardado
                    </div>
                    <div style={{ marginTop: '4px', color: '#64748b', fontSize: '12px' }}>
                      Path: {apiResponseFolioPath || '(configurar path)'}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button 
            className="btn"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormApiConfig;

