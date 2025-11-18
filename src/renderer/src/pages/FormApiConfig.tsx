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

  // Configuración de numeración
  const [numerationEnabled, setNumerationEnabled] = useState(false);
  const [numerationType, setNumerationType] = useState<'sequential' | 'date-based'>('sequential');
  const [numerationPrefix, setNumerationPrefix] = useState('');
  const [numerationSuffix, setNumerationSuffix] = useState('');
  const [numerationPadding, setNumerationPadding] = useState(5);
  const [numerationStartFrom, setNumerationStartFrom] = useState(1);
  const [numerationFieldId, setNumerationFieldId] = useState('');

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
        }

        if (tmpl.numerationConfig) {
          const num = tmpl.numerationConfig;
          setNumerationEnabled(num.enabled);
          setNumerationType(num.type || 'sequential');
          setNumerationPrefix(num.prefix || '');
          setNumerationSuffix(num.suffix || '');
          setNumerationPadding(num.padding || 5);
          setNumerationStartFrom(num.startFrom || 1);
          setNumerationFieldId(num.fieldId || '');
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
        if (tmpl.tableMappings) {
          setTableMappings(tmpl.tableMappings);
        } else if (tmpl.tables && tmpl.tables.length > 0) {
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
      const apiConfiguration = apiEnabled ? {
        enabled: true,
        endpoint: apiEndpoint,
        method: apiMethod,
        headers: {},
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

      const numerationConfig = numerationEnabled ? {
        enabled: true,
        type: numerationType,
        prefix: numerationPrefix,
        suffix: numerationSuffix,
        padding: numerationPadding,
        fieldId: numerationFieldId,
        autoIncrement: true,
        startFrom: numerationStartFrom
      } : undefined;

      const response = await window.electronAPI.updateFormTemplate(template.id, user.id, {
        apiConfiguration,
        numerationConfig,
        fieldMappings: apiEnabled ? fieldMappings : undefined,
        tableMappings: apiEnabled ? tableMappings : undefined
      });

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

              <div style={{ marginBottom: '15px' }}>
                <label>Campo donde mostrar el número:</label>
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
              </div>

              <div style={{ padding: '15px', background: '#f0f9ff', borderRadius: '5px', marginTop: '15px', border: '2px solid #2196F3' }}>
                <div style={{ marginBottom: '8px', color: '#0369a1', fontSize: '14px' }}>
                  <strong>📋 Próximo folio a generar:</strong>
                </div>
                <div style={{ fontSize: '24px', color: '#2196F3', fontWeight: 'bold', letterSpacing: '1px' }}>
                  {getPreviewNumber()}
                </div>
                <div style={{ marginTop: '8px', color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>
                  * Este será el número del próximo formulario impreso
                </div>
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

