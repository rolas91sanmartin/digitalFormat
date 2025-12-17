import React, { useState, useEffect } from 'react';
import {
  CustomControl,
  ControlType,
  ActionConfig,
  ActionType,
  SelectOption,
  CONTROL_TYPES_INFO, 
  ACTION_TYPES_INFO,
  createDefaultControl,
  createDefaultAction
} from '../types/CustomControls';

interface AvailableField {
  id: string;
  name: string;
  type?: 'ai-field' | 'custom-field' | 'control' | 'system';
  fieldType?: string;
}

interface AvailableTable {
  id: string;
  columns: {
    id: string;
    header: string;
    type: string;
  }[];
}

interface ControlCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (control: CustomControl) => void;
  editingControl?: CustomControl | null;
  availableFields: AvailableField[];
  availableTables?: AvailableTable[];
}

const ControlCreatorModal: React.FC<ControlCreatorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingControl,
  availableFields,
  availableTables = []
}) => {
  const [step, setStep] = useState<'type' | 'config' | 'actions'>('type');
  const [control, setControl] = useState<CustomControl | null>(null);
  const [selectedActionEvent, setSelectedActionEvent] = useState<'onClick' | 'onChange' | 'onLoad' | 'onBlur'>('onClick');
  const [showFormulaBuilder, setShowFormulaBuilder] = useState(false);
  
  useEffect(() => {
    if (editingControl) {
      setControl(editingControl);
      setStep('config');
    } else {
      setControl(null);
      setStep('type');
    }
  }, [editingControl, isOpen]);

  if (!isOpen) return null;

  const handleSelectType = (type: ControlType) => {
    const newControl = createDefaultControl(type, { x: 100, y: 100 });
    setControl(newControl);
    setStep('config');
  };

  const handleSave = () => {
    if (control) {
      onSave(control);
      // onClose ya es llamado por el componente padre en onSave
    }
  };

  const updateControlConfig = (key: string, value: any) => {
    if (!control) return;
    setControl({
      ...control,
      config: {
        ...control.config,
        [key]: value
      }
    });
  };

  const updateControlStyle = (key: string, value: any) => {
    if (!control) return;
    setControl({
      ...control,
      style: {
        ...control.style,
        [key]: value
      }
    });
  };

  const addAction = (actionType: ActionType) => {
    if (!control) return;
    const newAction = createDefaultAction(actionType);
    newAction.order = (control.actions[selectedActionEvent]?.length || 0);
    
    setControl({
      ...control,
      actions: {
        ...control.actions,
        [selectedActionEvent]: [
          ...(control.actions[selectedActionEvent] || []),
          newAction
        ]
      }
    });
  };

  const updateAction = (actionIndex: number, updates: Partial<ActionConfig>) => {
    if (!control) return;
    const actions = [...(control.actions[selectedActionEvent] || [])];
    actions[actionIndex] = { ...actions[actionIndex], ...updates };
    
    setControl({
      ...control,
      actions: {
        ...control.actions,
        [selectedActionEvent]: actions
      }
    });
  };

  const removeAction = (actionIndex: number) => {
    if (!control) return;
    const actions = [...(control.actions[selectedActionEvent] || [])];
    actions.splice(actionIndex, 1);
    
    setControl({
      ...control,
      actions: {
        ...control.actions,
        [selectedActionEvent]: actions
      }
    });
  };

  const addSelectOption = () => {
    if (!control) return;
    const options = control.config.selectOptions || [];
    const newOption: SelectOption = {
      id: `opt_${Date.now()}`,
      label: `Opción ${options.length + 1}`,
      value: `opcion${options.length + 1}`
    };
    updateControlConfig('selectOptions', [...options, newOption]);
  };

  const updateSelectOption = (index: number, field: 'label' | 'value', value: string) => {
    if (!control) return;
    const options = [...(control.config.selectOptions || [])];
    options[index] = { ...options[index], [field]: value };
    updateControlConfig('selectOptions', options);
  };

  const removeSelectOption = (index: number) => {
    if (!control) return;
    const options = [...(control.config.selectOptions || [])];
    options.splice(index, 1);
    updateControlConfig('selectOptions', options);
  };

  // Renderizar paso de selección de tipo
  const renderTypeSelection = () => (
    <div style={{ padding: '1rem' }}>
      <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>
        Selecciona el tipo de control
      </h3>
      
      {(['input', 'action', 'display', 'special'] as const).map(category => (
        <div key={category} style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            marginBottom: '0.75rem', 
            color: '#64748b',
            textTransform: 'capitalize',
            fontSize: '0.9rem',
            fontWeight: '600'
          }}>
            {category === 'input' ? '📝 Entrada de datos' : 
             category === 'action' ? '⚡ Acciones' : 
             category === 'display' ? '📊 Visualización' : '✨ Especiales'}
          </h4>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '0.75rem' 
          }}>
            {Object.entries(CONTROL_TYPES_INFO)
              .filter(([_, info]) => info.category === category)
              .map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => handleSelectType(type as ControlType)}
      style={{
        display: 'flex',
                    flexDirection: 'column',
        alignItems: 'center',
                    padding: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    background: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{info.icon}</span>
                  <span style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                    {info.label}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {info.description}
                  </span>
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );

  // Renderizar configuración específica del control
  const renderControlConfig = () => {
    if (!control) return null;

    return (
      <div style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>
          {CONTROL_TYPES_INFO[control.type].icon} Configurar {CONTROL_TYPES_INFO[control.type].label}
        </h3>

        {/* Nombre del control */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
            Nombre del control
          </label>
          <input
            type="text"
            value={control.name}
            onChange={(e) => setControl({ ...control, name: e.target.value })}
        style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '1rem'
            }}
          />
          </div>

        {/* Configuración específica según tipo */}
        {control.type === 'select' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Texto placeholder
              </label>
              <input
                type="text"
                value={control.config.selectPlaceholder || ''}
                onChange={(e) => updateControlConfig('selectPlaceholder', e.target.value)}
                placeholder="Seleccione una opción..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Opciones del selector
              </label>
              {control.config.selectOptions?.map((opt, idx) => (
                <div key={opt.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={opt.label}
                    onChange={(e) => updateSelectOption(idx, 'label', e.target.value)}
                    placeholder="Etiqueta visible"
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
                  <input
                    type="text"
                    value={opt.value}
                    onChange={(e) => updateSelectOption(idx, 'value', e.target.value)}
                    placeholder="Valor"
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                  />
          <button
                    onClick={() => removeSelectOption(idx)}
            style={{
                      padding: '0.5rem 0.75rem',
              background: '#ef4444',
              color: 'white',
              border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
          </button>
        </div>
              ))}
              <button
                onClick={addSelectOption}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginTop: '0.5rem'
                }}
              >
                ➕ Agregar opción
              </button>
          </div>
          </>
        )}

        {control.type === 'button' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Texto del botón
                  </label>
                  <input
                    type="text"
                value={control.config.buttonText || ''}
                onChange={(e) => updateControlConfig('buttonText', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                  borderRadius: '8px'
                    }}
                  />
                </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Estilo del botón
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {(['primary', 'secondary', 'success', 'danger', 'warning', 'info'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => updateControlConfig('buttonStyle', style)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: control.config.buttonStyle === style ? '2px solid #1e293b' : '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      background: style === 'primary' ? '#3b82f6' :
                                  style === 'secondary' ? '#6b7280' :
                                  style === 'success' ? '#10b981' :
                                  style === 'danger' ? '#ef4444' :
                                  style === 'warning' ? '#f59e0b' : '#06b6d4',
                      color: 'white',
                      fontWeight: '600'
                    }}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {control.type === 'radio' && (
          <>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Disposición
              </label>
              <select
                value={control.config.radioLayout || 'horizontal'}
                onChange={(e) => updateControlConfig('radioLayout', e.target.value)}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', width: '100%' }}
              >
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                      Opciones
                    </label>
              {control.config.radioOptions?.map((opt, idx) => (
                <div key={opt.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          value={opt.label}
                    onChange={(e) => {
                      const options = [...(control.config.radioOptions || [])];
                      options[idx] = { ...options[idx], label: e.target.value };
                      updateControlConfig('radioOptions', options);
                    }}
                    placeholder="Etiqueta"
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        />
                        <input
                          type="text"
                          value={opt.value}
                    onChange={(e) => {
                      const options = [...(control.config.radioOptions || [])];
                      options[idx] = { ...options[idx], value: e.target.value };
                      updateControlConfig('radioOptions', options);
                    }}
                    placeholder="Valor"
                          style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        />
                        <button
                    onClick={() => {
                      const options = [...(control.config.radioOptions || [])];
                      options.splice(idx, 1);
                      updateControlConfig('radioOptions', options);
                    }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                    ✕
                        </button>
                      </div>
                    ))}
                    <button
                onClick={() => {
                  const options = control.config.radioOptions || [];
                  updateControlConfig('radioOptions', [
                    ...options,
                    { id: `opt_${Date.now()}`, label: `Opción ${options.length + 1}`, value: `opcion${options.length + 1}` }
                  ]);
                }}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginTop: '0.5rem'
                      }}
                    >
                ➕ Agregar opción
                    </button>
                  </div>
          </>
                )}

        {control.type === 'label' && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Texto de la etiqueta
                      </label>
                      <input
                        type="text"
                value={control.config.labelText || ''}
                onChange={(e) => updateControlConfig('labelText', e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px'
                }}
                      />
                    </div>
            
                    <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Estilo de texto
                      </label>
                      <select
                value={control.config.labelStyle || 'normal'}
                onChange={(e) => updateControlConfig('labelStyle', e.target.value)}
                style={{ padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px', width: '100%' }}
              >
                <option value="title">Título grande</option>
                <option value="subtitle">Subtítulo</option>
                <option value="normal">Normal</option>
                <option value="small">Pequeño</option>
                      </select>
                    </div>
                  </>
                )}

        {control.type === 'calculated' && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Fórmula de cálculo
              </label>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                • Usa {'{'}nombreCampo{'}'} para campos normales<br/>
                • Usa {'{'}NombreColumna{'}'} para columnas de tabla (suma todas las filas)<br/>
                • Usa <code>SUM(tabla.columna)</code> para sumar explícitamente
              </p>
                      <textarea
                value={control.config.formula || ''}
                onChange={(e) => updateControlConfig('formula', e.target.value)}
                placeholder="{precio} * {cantidad} o SUM(tabla.total)"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          minHeight: '80px',
                          fontFamily: 'monospace'
                        }}
                      />
              
              {/* Asistente de fórmulas */}
              <div style={{ marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                <button
                  onClick={() => setShowFormulaBuilder(!showFormulaBuilder)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {showFormulaBuilder ? '✕ Cerrar' : '🧙‍♂️ Abrir'} Asistente de Fórmulas
                </button>
                    </div>
              
              {/* Constructor visual de fórmulas */}
              {showFormulaBuilder && (
                <div style={{ 
                  marginBottom: '1rem', 
                  padding: '1rem', 
                  background: '#faf5ff', 
                  borderRadius: '8px', 
                  border: '2px solid #d8b4fe' 
                }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#6b21a8', marginBottom: '0.75rem' }}>
                    🧙‍♂️ Constructor Visual de Fórmulas
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* Operadores */}
                      <div>
                      <div style={{ fontSize: '0.8rem', color: '#6b21a8', marginBottom: '0.35rem', fontWeight: '600' }}>
                        Operadores:
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {[
                          { op: ' + ', label: '+ Sumar' },
                          { op: ' - ', label: '- Restar' },
                          { op: ' * ', label: '× Multiplicar' },
                          { op: ' / ', label: '÷ Dividir' },
                          { op: '(', label: '( Paréntesis' },
                          { op: ')', label: ') Cerrar' }
                        ].map(({ op, label }) => (
                          <button
                            key={op}
                            onClick={() => updateControlConfig('formula', (control.config.formula || '') + op)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: '#e9d5ff',
                              color: '#6b21a8',
                              border: '1px solid #c084fc',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.85rem',
                              fontWeight: '600'
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Números comunes */}
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#6b21a8', marginBottom: '0.35rem', fontWeight: '600' }}>
                        Porcentajes comunes:
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {[
                          { value: ' * 0.10', label: '× 10%' },
                          { value: ' * 0.15', label: '× 15%' },
                          { value: ' * 0.16', label: '× 16% (IVA)' },
                          { value: ' * 1.15', label: '× 1.15 (con 15%)' },
                          { value: ' * 1.16', label: '× 1.16 (con IVA)' }
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => updateControlConfig('formula', (control.config.formula || '') + value)}
                            style={{
                              padding: '0.4rem 0.75rem',
                              background: '#ddd6fe',
                              color: '#5b21b6',
                              border: '1px solid #a78bfa',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Acciones rápidas */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => updateControlConfig('formula', '')}
                        style={{
                          padding: '0.4rem 0.75rem',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        🗑️ Limpiar
                      </button>
                      <button
                        onClick={() => {
                          const formula = control.config.formula || '';
                          const lastChar = formula[formula.length - 1];
                          if (lastChar) {
                            updateControlConfig('formula', formula.slice(0, -1));
                          }
                        }}
                        style={{
                          padding: '0.4rem 0.75rem',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}
                      >
                        ⌫ Borrar último
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Validación de fórmula en tiempo real */}
              {(() => {
                const formula = control.config.formula || '';
                const errors: string[] = [];
                
                // Detectar números con llaves {0.15}
                const numberInBraces = formula.match(/\{[\d.]+\}/g);
                if (numberInBraces) {
                  errors.push(`❌ Los números NO deben tener llaves: ${numberInBraces.join(', ')} → Quita las llaves`);
                }
                
                // Detectar mayúsculas/minúsculas inconsistentes en nombres de campos
                const fieldsInFormula = formula.match(/\{([^}]+)\}/g) || [];
                fieldsInFormula.forEach(fieldRef => {
                  const fieldName = fieldRef.slice(1, -1);
                  const matchingField = availableFields.find(f => 
                    f.name.toLowerCase() === fieldName.toLowerCase() && f.name !== fieldName
                  );
                  if (matchingField) {
                    errors.push(`⚠️ Cuidado con mayúsculas: ${fieldRef} → debe ser {${matchingField.name}}`);
                  }
                });
                
                // Detectar operaciones sin paréntesis que pueden ser ambiguas
                if (formula.includes('-') && formula.includes('*') && !formula.includes('(')) {
                  errors.push('⚠️ Recomendado: Usa paréntesis para clarificar el orden: ({campo1} - {campo2}) * 0.15');
                }
                
                // Detectar campos con llaves no cerradas
                const openBraces = (formula.match(/\{/g) || []).length;
                const closeBraces = (formula.match(/\}/g) || []).length;
                if (openBraces !== closeBraces) {
                  errors.push('❌ Hay llaves sin cerrar: { } deben estar balanceadas');
                }
                
                // Mostrar errores
                if (errors.length > 0) {
                  // Función para corregir automáticamente
                  const autoFixFormula = () => {
                    let fixed = formula;
                    
                    // Quitar llaves de números
                    fixed = fixed.replace(/\{([\d.]+)\}/g, '$1');
                    
                    // Corregir mayúsculas/minúsculas de campos
                    availableFields.forEach(field => {
                      const regex = new RegExp(`\\{${field.name}\\}`, 'gi');
                      fixed = fixed.replace(regex, `{${field.name}}`);
                    });
                    
                    updateControlConfig('formula', fixed);
                  };
                  
                  return (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.75rem', 
                      background: '#fef2f2', 
                      borderRadius: '6px', 
                      border: '1px solid #fecaca' 
                    }}>
                      {errors.map((err, i) => (
                        <div key={i} style={{ fontSize: '0.85rem', color: '#991b1b', marginBottom: '0.5rem' }}>
                          {err}
                        </div>
                      ))}
                      <button
                        onClick={autoFixFormula}
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem 1rem',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600'
                        }}
                      >
                        🔧 Corregir automáticamente
                      </button>
                    </div>
                  );
                }
                
                // Mostrar éxito
                if (formula.length > 0) {
                  return (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      background: '#f0fdf4', 
                      borderRadius: '6px', 
                      border: '1px solid #bbf7d0' 
                    }}>
                      <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                        ✅ Fórmula válida
                      </div>
                    </div>
                  );
                }
                
                return null;
              })()}
              
              {/* Ejemplos de fórmulas comunes */}
              <details style={{ marginTop: '0.75rem' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  fontSize: '0.85rem', 
                  color: '#3b82f6', 
                  fontWeight: '600',
                  padding: '0.5rem',
                  background: '#eff6ff',
                  borderRadius: '6px'
                }}>
                  💡 Ver ejemplos de fórmulas
                </summary>
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.75rem', 
                  background: '#f8fafc', 
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace'
                }}>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Operaciones básicas:</strong></div>
                  <div style={{ color: '#475569', lineHeight: '1.8' }}>
                    • <code>{'{'}precio{'}'} * {'{'}cantidad{'}'}</code> → Multiplicación<br/>
                    • <code>{'{'}total{'}'} - {'{'}descuento{'}'}</code> → Resta<br/>
                    • <code>{'{'}subtotal{'}'} * 0.15</code> → IVA 15%<br/>
                    • <code>({'{'}subtotal{'}'} - {'{'}descuento{'}'}) * 1.16</code> → Total con IVA
                  </div>
                  <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}><strong>Con columnas de tabla:</strong></div>
                  <div style={{ color: '#475569', lineHeight: '1.8' }}>
                    • <code>{'{'}SubTotal{'}'}</code> → Referencia directa a columna<br/>
                    • <code>{'{'}SubTotal{'}'} * 0.15</code> → IVA de columna de tabla<br/>
                    • <code>SUM(tabla.Total)</code> → Suma explícita<br/>
                    • <code>{'{'}Total{'}'} - {'{'}descuento{'}'}</code> → Mezclar tabla y campos
                  </div>
                </div>
              </details>
            </div>
            
            {/* Campos disponibles */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                📄 Campos disponibles para referencia:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {availableFields.map(field => (
                  <span
                    key={field.id}
                    style={{
                      padding: '0.25rem 0.5rem',
                      background: '#e0f2fe',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      color: '#0369a1',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      const formula = (control.config.formula || '') + `{${field.name}}`;
                      updateControlConfig('formula', formula);
                    }}
                    title="Clic para agregar a la fórmula"
                  >
                    {'{' + field.name + '}'}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Funciones de agregación para tablas */}
            {availableTables.length > 0 && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#166534' }}>
                  📊 Funciones de Tabla (columnas):
                </label>
                
                {/* Funciones disponibles */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.5rem' }}>
                    Funciones disponibles:
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'].map(func => (
                      <span
                        key={func}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#dcfce7',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color: '#166534',
                          fontWeight: '600',
                          fontFamily: 'monospace'
                        }}
                      >
                        {func}()
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Columnas por tabla */}
                {availableTables.map(table => (
                  <div key={table.id} style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', color: '#166534', marginBottom: '0.35rem', fontWeight: '600' }}>
                      🗃️ Tabla: {table.id.substring(0, 12)}...
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {table.columns.map(col => (
                        <div key={col.id} style={{ display: 'flex', gap: '2px' }}>
                          {['SUM', 'COUNT', 'AVG', 'MIN', 'MAX'].map(func => (
                            <span
                              key={`${func}-${col.id}`}
                              onClick={() => {
                                const formula = (control.config.formula || '') + `${func}(${table.id}.${col.header})`;
                                updateControlConfig('formula', formula);
                              }}
                              style={{
                                padding: '0.2rem 0.4rem',
                                background: func === 'SUM' ? '#fef3c7' : 
                                           func === 'COUNT' ? '#dbeafe' :
                                           func === 'AVG' ? '#e0e7ff' :
                                           func === 'MIN' ? '#fce7f3' : '#dcfce7',
                                borderRadius: '3px',
                                fontSize: '0.7rem',
                                color: '#374151',
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                border: '1px solid #d1d5db'
                              }}
                              title={`${func}(${table.id}.${col.header}) - Clic para agregar`}
                            >
                              {func}({col.header})
                            </span>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div style={{ marginTop: '0.75rem', padding: '0.5rem', background: 'white', borderRadius: '4px', fontSize: '0.75rem', color: '#6b7280' }}>
                  💡 <strong>Ejemplo:</strong> <code>SUM(tabla.Total)</code> suma todos los valores de la columna "Total"
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                          Decimales
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                  value={control.config.decimalPlaces || 2}
                  onChange={(e) => updateControlConfig('decimalPlaces', parseInt(e.target.value))}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        />
                      </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                          Prefijo
                        </label>
                        <input
                          type="text"
                  value={control.config.prefix || ''}
                  onChange={(e) => updateControlConfig('prefix', e.target.value)}
                          placeholder="$"
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        />
                      </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                          Sufijo
                        </label>
                        <input
                          type="text"
                  value={control.config.suffix || ''}
                  onChange={(e) => updateControlConfig('suffix', e.target.value)}
                          placeholder="%"
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        />
                      </div>
                    </div>
            
            {/* Apariencia del campo calculado */}
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                🎨 Apariencia del campo:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {[
                  { value: 'input', label: 'Input', desc: 'Con fondo gris', icon: '📝' },
                  { value: 'transparent', label: 'Transparente', desc: 'Sin fondo ni borde', icon: '👻' },
                  { value: 'underline', label: 'Subrayado', desc: 'Solo línea inferior', icon: '➖' },
                  { value: 'bordered', label: 'Con borde', desc: 'Borde completo', icon: '⬜' },
                  { value: 'label', label: 'Como etiqueta', desc: 'Texto plano', icon: '🏷️' },
                  { value: 'badge', label: 'Badge', desc: 'Estilo insignia', icon: '🔖' }
                ].map(style => (
                  <button
                    key={style.value}
                    onClick={() => updateControlConfig('displayStyle', style.value)}
                    style={{
                      padding: '0.75rem',
                      border: control.config.displayStyle === style.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                      borderRadius: '8px',
                      background: control.config.displayStyle === style.value ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{style.icon}</div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{style.label}</div>
                    <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Label asociado al campo calculado */}
            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #e2e8f0' 
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={control.config.showLabel || false}
                  onChange={(e) => updateControlConfig('showLabel', e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontWeight: '600', color: '#475569', fontSize: '1rem' }}>
                  🏷️ Mostrar etiqueta descriptiva
                </span>
              </label>
              
              {control.config.showLabel && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                      Texto de la etiqueta:
                      </label>
                      <input
                        type="text"
                      value={control.config.labelText || ''}
                      onChange={(e) => updateControlConfig('labelText', e.target.value)}
                      placeholder="Ej: Total General, IVA, Subtotal..."
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                      />
                    </div>
                  
                    <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                      Posición de la etiqueta:
                      </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                      {[
                        { value: 'top', label: 'Arriba', icon: '⬆️' },
                        { value: 'left', label: 'Izquierda', icon: '⬅️' },
                        { value: 'right', label: 'Derecha', icon: '➡️' }
                      ].map(pos => (
                        <button
                          key={pos.value}
                          onClick={() => updateControlConfig('labelPosition', pos.value)}
                          style={{
                            padding: '0.75rem',
                            border: control.config.labelPosition === pos.value ? '2px solid #3b82f6' : '1px solid #d1d5db',
                            borderRadius: '8px',
                            background: control.config.labelPosition === pos.value ? '#eff6ff' : 'white',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontWeight: '500'
                          }}
                        >
                          <div style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{pos.icon}</div>
                          <div style={{ fontSize: '0.85rem' }}>{pos.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '0.75rem', 
                    background: '#f0f9ff', 
                    borderRadius: '6px', 
                    border: '1px solid #bae6fd' 
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>
                      💡 <strong>Vista previa:</strong> La etiqueta se mostrará junto al campo calculado en la posición seleccionada.
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Configuración de formato numérico */}
            <div style={{ 
              marginTop: '1.5rem', 
              paddingTop: '1rem', 
              borderTop: '1px solid #e2e8f0' 
            }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#475569', marginBottom: '1rem' }}>
                🔢 Formato Numérico
              </h4>
              
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569' }}>
                  Decimales a mostrar:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[0, 1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => updateControlConfig('decimalPlaces', num)}
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        border: '2px solid',
                        borderColor: (control.config.decimalPlaces ?? 2) === num ? '#10b981' : '#d1d5db',
                        backgroundColor: (control.config.decimalPlaces ?? 2) === num ? '#10b981' : 'white',
                        color: (control.config.decimalPlaces ?? 2) === num ? 'white' : '#374151',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '1rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569', fontSize: '0.9rem' }}>
                    Prefijo (antes del número):
                  </label>
                  <input
                    type="text"
                    value={control.config.prefix || ''}
                    onChange={(e) => updateControlConfig('prefix', e.target.value)}
                    placeholder="C$ "
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500', color: '#475569', fontSize: '0.9rem' }}>
                    Sufijo (después del número):
                  </label>
                  <input
                    type="text"
                    value={control.config.suffix || ''}
                    onChange={(e) => updateControlConfig('suffix', e.target.value)}
                    placeholder=" USD"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>
              
              {/* Ejemplos rápidos */}
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
                <div style={{ marginBottom: '0.25rem' }}>💡 Ejemplos comunes:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                  {[
                    { label: 'C$ ', type: 'prefix' },
                    { label: '$ ', type: 'prefix' },
                    { label: '€ ', type: 'prefix' },
                    { label: ' USD', type: 'suffix' },
                    { label: '%', type: 'suffix' },
                    { label: ' km', type: 'suffix' }
                  ].map((example, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (example.type === 'prefix') {
                          updateControlConfig('prefix', example.label);
                        } else {
                          updateControlConfig('suffix', example.label);
                        }
                      }}
                      style={{
                        padding: '0.25rem 0.5rem',
                        fontSize: '0.7rem',
                        backgroundColor: 'white',
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#374151'
                      }}
                    >
                      {example.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Vista previa */}
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #d1fae5'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                  👁️ Vista previa:
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#10b981', display: 'flex', alignItems: 'center', gap: '2px' }}>
                  {control.config.prefix && <span>{control.config.prefix}</span>}
                  <span>{(1234567.89).toLocaleString('en-US', { minimumFractionDigits: control.config.decimalPlaces ?? 2, maximumFractionDigits: control.config.decimalPlaces ?? 2 })}</span>
                  {control.config.suffix && <span>{control.config.suffix}</span>}
                </div>
              </div>
            </div>
                  </>
                )}

        {control.type === 'toggle' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Texto cuando está ON
                      </label>
                      <input
                type="text"
                value={control.config.toggleOnLabel || 'Sí'}
                onChange={(e) => updateControlConfig('toggleOnLabel', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Texto cuando está OFF
                      </label>
                      <input
                type="text"
                value={control.config.toggleOffLabel || 'No'}
                onChange={(e) => updateControlConfig('toggleOffLabel', e.target.value)}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
          </div>
        )}

        {control.type === 'checkbox' && (
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
              Etiqueta del Checkbox
            </label>
            <input
              type="text"
              value={control.config.checkboxLabel || ''}
              onChange={(e) => updateControlConfig('checkboxLabel', e.target.value)}
              placeholder="Ej: Sin IVA, Exento, Aplicar Descuento..."
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', marginBottom: '1rem' }}
            />
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={control.config.checkboxDefaultValue || false}
                onChange={(e) => updateControlConfig('checkboxDefaultValue', e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span style={{ fontWeight: '500', color: '#475569' }}>
                Marcado por defecto
              </span>
            </label>
            
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              backgroundColor: '#f0f9ff',
              borderRadius: '6px',
              border: '1px solid #bae6fd'
            }}>
              <div style={{ fontSize: '0.85rem', color: '#0369a1', marginBottom: '0.5rem' }}>
                💡 <strong>Uso en fórmulas:</strong>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#0c4a6e' }}>
                Puedes usar este checkbox en fórmulas de campos calculados.<br />
                Cuando esté <strong>marcado</strong> su valor será <code>1</code> (o <code>true</code>)<br />
                Cuando esté <strong>desmarcado</strong> su valor será <code>0</code> (o <code>false</code>)
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace', backgroundColor: 'white', padding: '0.5rem', borderRadius: '4px' }}>
                Ejemplo: {'{'}SIN_IVA{'}'} ? 0 : ({'{'}SubTotal{'}'} * 0.15)
              </div>
            </div>
          </div>
        )}

        {control.type === 'range-slider' && (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Valor mínimo
                      </label>
                      <input
                        type="number"
                value={control.config.minValue || 0}
                onChange={(e) => updateControlConfig('minValue', parseFloat(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Valor máximo
                      </label>
                      <input
                type="number"
                value={control.config.maxValue || 100}
                onChange={(e) => updateControlConfig('maxValue', parseFloat(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
            <div style={{ flex: '1 1 120px' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                Incremento
                      </label>
                      <input
                type="number"
                value={control.config.step || 1}
                onChange={(e) => updateControlConfig('step', parseFloat(e.target.value))}
                        style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                )}

        {control.type === 'file' && (
                  <>
                    <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                        Tipos de archivo permitidos
                      </label>
                      <input
                        type="text"
                value={(control.config.acceptedTypes || []).join(', ')}
                onChange={(e) => updateControlConfig('acceptedTypes', e.target.value.split(',').map(t => t.trim()))}
                placeholder="pdf, jpg, png, docx"
                style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.25rem' }}>
                Separados por coma
              </p>
                    </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
                          Tamaño máximo (MB)
                        </label>
                        <input
                          type="number"
                value={control.config.maxSizeMB || 5}
                onChange={(e) => updateControlConfig('maxSizeMB', parseInt(e.target.value))}
                          style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        />
                    </div>
                  </>
                )}

        {/* Estilos comunes */}
        <div style={{ 
          marginTop: '1.5rem', 
          paddingTop: '1rem', 
          borderTop: '1px solid #e2e8f0' 
        }}>
          <h4 style={{ marginBottom: '1rem', color: '#475569' }}>🎨 Estilos</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                Tamaño fuente
              </label>
              <input
                type="number"
                value={control.style?.fontSize || 12}
                onChange={(e) => updateControlStyle('fontSize', parseInt(e.target.value))}
                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
              />
            </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                Color texto
                      </label>
                      <input
                        type="color"
                value={control.style?.color || '#000000'}
                onChange={(e) => updateControlStyle('color', e.target.value)}
                style={{ width: '100%', height: '38px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
            <div style={{ flex: '1 1 100px' }}>
              <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.85rem', color: '#64748b' }}>
                Color fondo
                      </label>
                      <input
                        type="color"
                value={control.style?.backgroundColor || '#ffffff'}
                onChange={(e) => updateControlStyle('backgroundColor', e.target.value)}
                style={{ width: '100%', height: '38px', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                    </div>
                  </div>
              </div>
                </div>
    );
  };

  // Renderizar configuración de acciones
  const renderActionsConfig = () => {
    if (!control) return null;

    const currentActions = control.actions[selectedActionEvent] || [];

    return (
      <div style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem', color: '#1e293b' }}>
          ⚡ Configurar Acciones
        </h3>
        
        {/* Selector de evento */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
            Evento que dispara las acciones:
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['onClick', 'onChange', 'onLoad', 'onBlur'] as const).map(event => (
              <button
                key={event}
                onClick={() => setSelectedActionEvent(event)}
                      style={{
                  padding: '0.5rem 1rem',
                  border: selectedActionEvent === event ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '8px',
                  background: selectedActionEvent === event ? '#eff6ff' : 'white',
                        cursor: 'pointer',
                  fontWeight: selectedActionEvent === event ? '600' : '400'
                }}
              >
                {event === 'onClick' ? '🖱️ Al hacer clic' :
                 event === 'onChange' ? '✏️ Al cambiar valor' :
                 event === 'onLoad' ? '📥 Al cargar' : '👁️ Al perder foco'}
              </button>
            ))}
                    </div>
        </div>

        {/* Lista de acciones */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
            Acciones encadenadas (se ejecutan en orden):
          </label>
          
          {currentActions.length === 0 ? (
            <p style={{ color: '#64748b', fontStyle: 'italic', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              No hay acciones configuradas para este evento.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentActions.map((action, idx) => (
                          <div
                            key={action.id}
                            style={{
                    padding: '1rem',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                      {idx + 1}. {ACTION_TYPES_INFO[action.type].icon} {ACTION_TYPES_INFO[action.type].label}
                            </span>
                            <button
                      onClick={() => removeAction(idx)}
                              style={{
                        padding: '0.25rem 0.5rem',
                        background: '#ef4444',
                            color: 'white',
                            border: 'none',
                        borderRadius: '4px',
                            cursor: 'pointer',
                        fontSize: '0.8rem'
                          }}
                        >
                      🗑️ Eliminar
                        </button>
              </div>

                  {/* Configuración específica de la acción */}
                  {action.type === 'api-call' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* URL y Método */}
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                          Endpoint URL:
                      </label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <select
                            value={action.apiConfig?.method || 'GET'}
                            onChange={(e) => updateAction(idx, { 
                              apiConfig: { ...action.apiConfig, method: e.target.value as any }
                            })}
                            style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', minWidth: '90px' }}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                          </select>
                      <input
                        type="text"
                            id={`api-url-${action.id}`}
                            value={action.apiConfig?.url || ''}
                            onChange={(e) => updateAction(idx, { 
                              apiConfig: { ...action.apiConfig, url: e.target.value }
                            })}
                            placeholder="https://api.ejemplo.com/endpoint/{id}"
                            style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'monospace' }}
                      />
                    </div>

                        {/* Campos disponibles para la URL */}
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0f9ff', borderRadius: '6px', border: '1px solid #bae6fd' }}>
                          <div style={{ fontSize: '0.75rem', color: '#0369a1', marginBottom: '0.35rem', fontWeight: '600' }}>
                            📌 Campos disponibles (clic para agregar a URL):
                    </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                            {availableFields.map(f => {
                              const icon = f.type === 'ai-field' ? '🤖' : 
                                          f.type === 'custom-field' ? '✏️' : 
                                          f.type === 'control' ? '⚡' : 
                                          f.type === 'system' ? '🔢' : '📄';
                              const bgColor = f.type === 'system' ? '#fef3c7' : '#dbeafe';
                              const borderColor = f.type === 'system' ? '#fbbf24' : '#93c5fd';
                              const textColor = f.type === 'system' ? '#92400e' : '#1e40af';
                              
                              return (
                                <span
                                  key={f.id}
                                  onClick={() => {
                                    const currentUrl = action.apiConfig?.url || '';
                                    updateAction(idx, { 
                                      apiConfig: { ...action.apiConfig, url: currentUrl + `{${f.name}}` }
                                    });
                                  }}
                                  style={{
                                    padding: '0.2rem 0.5rem',
                                    background: bgColor,
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    color: textColor,
                                    cursor: 'pointer',
                                    border: `1px solid ${borderColor}`,
                                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                                    gap: '0.2rem'
                                  }}
                                  title={`${icon} ${f.type === 'ai-field' ? 'Campo IA' : f.type === 'custom-field' ? 'Campo Personalizado' : f.type === 'control' ? 'Control Avanzado' : f.type === 'system' ? 'Campo Sistema' : 'Campo'}: {${f.name}}`}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#3b82f6';
                                    e.currentTarget.style.color = 'white';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = bgColor;
                                    e.currentTarget.style.color = textColor;
                                  }}
                                >
                                  <span>{icon}</span>
                                  <span>{'{' + f.name + '}'}</span>
                                </span>
                              );
                            })}
                  </div>
                          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <span>🤖 Campo IA</span>
                            <span>✏️ Personalizado</span>
                            <span>⚡ Control</span>
                            <span>🔢 Sistema (folio)</span>
              </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.35rem' }}>
                            💡 Ejemplo: <code style={{ background: 'white', padding: '1px 4px', borderRadius: '3px' }}>https://api.com/clientes/{'{'}codigo_cliente{'}'}</code>
            </div>
                        </div>
                        
                        {/* Validación de campos requeridos */}
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                    <input
                              type="checkbox"
                              checked={action.apiConfig?.validateBeforeCall ?? true}
                              onChange={(e) => updateAction(idx, { 
                                apiConfig: { ...action.apiConfig, validateBeforeCall: e.target.checked }
                              })}
                            />
                            <span style={{ color: '#991b1b', fontWeight: '500' }}>
                              ⚠️ Validar que los campos en la URL tengan valor antes de ejecutar
                            </span>
                          </label>
                          <div style={{ fontSize: '0.7rem', color: '#7f1d1d', marginTop: '0.25rem', marginLeft: '1.5rem' }}>
                            Si está activado, la API no se ejecutará si algún campo {'{'}...{'}'} está vacío
                  </div>
                        </div>
                      </div>

                      {/* Tipo de Autenticación */}
                  <div>
                        <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                          Autenticación:
                    </label>
                    <select
                          value={action.apiConfig?.authType || 'none'}
                          onChange={(e) => updateAction(idx, { 
                            apiConfig: { ...action.apiConfig, authType: e.target.value as any }
                          })}
                          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', width: '100%' }}
                        >
                          <option value="none">Sin autenticación</option>
                          <option value="bearer">Bearer Token</option>
                          <option value="apikey">API Key (Header)</option>
                          <option value="basic">Basic Auth</option>
                    </select>
                </div>

                      {/* Bearer Token */}
                      {action.apiConfig?.authType === 'bearer' && (
                  <div>
                          <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                            Bearer Token:
                    </label>
                    <input
                            type="password"
                            value={action.apiConfig?.bearerToken || ''}
                            onChange={(e) => updateAction(idx, { 
                              apiConfig: { ...action.apiConfig, bearerToken: e.target.value }
                            })}
                            placeholder="tu-token-secreto"
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  </div>
                      )}

                      {/* API Key */}
                      {action.apiConfig?.authType === 'apikey' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                              Nombre Header:
                    </label>
                    <input
                              type="text"
                              value={action.apiConfig?.apiKeyHeader || 'X-API-Key'}
                              onChange={(e) => updateAction(idx, { 
                                apiConfig: { ...action.apiConfig, apiKeyHeader: e.target.value }
                              })}
                              placeholder="X-API-Key"
                              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  </div>
                          <div style={{ flex: 2 }}>
                            <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                              API Key:
                    </label>
                    <input
                              type="password"
                              value={action.apiConfig?.apiKeyValue || ''}
                              onChange={(e) => updateAction(idx, { 
                                apiConfig: { ...action.apiConfig, apiKeyValue: e.target.value }
                              })}
                              placeholder="tu-api-key"
                              style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  </div>
                        </div>
                      )}

                      {/* Basic Auth */}
                      {action.apiConfig?.authType === 'basic' && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                              Usuario:
                    </label>
                    <input
                              type="text"
                              value={action.apiConfig?.basicUsername || ''}
                              onChange={(e) => updateAction(idx, { 
                                apiConfig: { ...action.apiConfig, basicUsername: e.target.value }
                              })}
                              placeholder="usuario"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  </div>
                          <div style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                              Contraseña:
                    </label>
                    <input
                              type="password"
                              value={action.apiConfig?.basicPassword || ''}
                              onChange={(e) => updateAction(idx, { 
                                apiConfig: { ...action.apiConfig, basicPassword: e.target.value }
                              })}
                              placeholder="contraseña"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  </div>
                </div>
                      )}

                      {/* Headers Personalizados */}
                  <div>
                        <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                          Headers Personalizados:
                    </label>
                        {(action.apiConfig?.customHeaders || []).map((header: any, hIdx: number) => (
                          <div key={hIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <input
                              type="text"
                              value={header.key}
                              onChange={(e) => {
                                const newHeaders = [...(action.apiConfig?.customHeaders || [])];
                                newHeaders[hIdx] = { ...newHeaders[hIdx], key: e.target.value };
                                updateAction(idx, { apiConfig: { ...action.apiConfig, customHeaders: newHeaders } });
                              }}
                              placeholder="Content-Type"
                              style={{ flex: 1, padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                    <input
                              type="text"
                              value={header.value}
                              onChange={(e) => {
                                const newHeaders = [...(action.apiConfig?.customHeaders || [])];
                                newHeaders[hIdx] = { ...newHeaders[hIdx], value: e.target.value };
                                updateAction(idx, { apiConfig: { ...action.apiConfig, customHeaders: newHeaders } });
                              }}
                              placeholder="application/json"
                              style={{ flex: 1, padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                            <button
                              onClick={() => {
                                const newHeaders = (action.apiConfig?.customHeaders || []).filter((_: any, i: number) => i !== hIdx);
                                updateAction(idx, { apiConfig: { ...action.apiConfig, customHeaders: newHeaders } });
                              }}
                              style={{ padding: '0.4rem 0.6rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ✕
                            </button>
                  </div>
                        ))}
                        <button
                          onClick={() => {
                            const newHeaders = [...(action.apiConfig?.customHeaders || []), { key: '', value: '' }];
                            updateAction(idx, { apiConfig: { ...action.apiConfig, customHeaders: newHeaders } });
                          }}
                          style={{ padding: '0.3rem 0.6rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.25rem' }}
                        >
                          ➕ Agregar Header
                        </button>
              </div>

                      {/* Body Template (solo para POST, PUT, PATCH) */}
                      {['POST', 'PUT', 'PATCH'].includes(action.apiConfig?.method || 'GET') && (
                        <div>
                          <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                            Body (JSON):
                          </label>
                          <textarea
                            id={`api-body-${action.id}`}
                            value={action.apiConfig?.bodyTemplate || ''}
                            onChange={(e) => updateAction(idx, { 
                              apiConfig: { ...action.apiConfig, bodyTemplate: e.target.value }
                            })}
                            placeholder={'{\n  "campo": "{nombre_campo}",\n  "valor": "{otro_campo}"\n}'}
                            rows={5}
                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                          />
                          
                          {/* Campos disponibles para el Body */}
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                            <div style={{ fontSize: '0.75rem', color: '#166534', marginBottom: '0.35rem', fontWeight: '600' }}>
                              📌 Campos disponibles (clic para agregar al body):
                </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                              {availableFields.map(f => {
                                const icon = f.type === 'ai-field' ? '🤖' : 
                                            f.type === 'custom-field' ? '✏️' : 
                                            f.type === 'control' ? '⚡' : 
                                            f.type === 'system' ? '🔢' : '📄';
                                
                                return (
                                  <span
                                    key={f.id}
            onClick={() => {
                                      const currentBody = action.apiConfig?.bodyTemplate || '';
                                      updateAction(idx, { 
                                        apiConfig: { ...action.apiConfig, bodyTemplate: currentBody + `{${f.name}}` }
                                      });
                                    }}
            style={{
                                      padding: '0.2rem 0.5rem',
                                      background: '#dcfce7',
                                      borderRadius: '4px',
                                      fontSize: '0.75rem',
                                      color: '#166534',
                                      cursor: 'pointer',
                                      border: '1px solid #86efac',
                                      transition: 'all 0.15s',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.2rem'
                                    }}
                                    title={`${icon} Agregar {${f.name}} al body`}
                                    onMouseOver={(e) => {
                                      e.currentTarget.style.background = '#22c55e';
                                      e.currentTarget.style.color = 'white';
                                    }}
                                    onMouseOut={(e) => {
                                      e.currentTarget.style.background = '#dcfce7';
                                      e.currentTarget.style.color = '#166534';
                                    }}
                                  >
                                    <span>{icon}</span>
                                    <span>{'{' + f.name + '}'}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Botón para generar JSON de ejemplo */}
                          <div style={{ marginTop: '0.5rem' }}>
              <button
                onClick={() => {
                                const exampleJson: Record<string, string> = {};
                                availableFields.forEach(f => {
                                  exampleJson[f.name.toLowerCase().replace(/\s+/g, '_')] = `{${f.name}}`;
                                });
                                updateAction(idx, { 
                                  apiConfig: { ...action.apiConfig, bodyTemplate: JSON.stringify(exampleJson, null, 2) }
                                });
                }}
                style={{
                                padding: '0.4rem 0.75rem',
                                background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                                borderRadius: '4px',
                  cursor: 'pointer',
                                fontSize: '0.8rem'
                }}
              >
                              ✨ Generar JSON con todos los campos
              </button>
                          </div>
                        </div>
                      )}

                      {/* Mapeo de Respuesta */}
                      <div>
                        <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                          Mapear Respuesta a Campos:
                        </label>
                        {(action.apiConfig?.responseMapping || []).map((mapping: any, mIdx: number) => (
                          <div key={mIdx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                            <input
                              type="text"
                              value={mapping.jsonPath}
                              onChange={(e) => {
                                const newMappings = [...(action.apiConfig?.responseMapping || [])];
                                newMappings[mIdx] = { ...newMappings[mIdx], jsonPath: e.target.value };
                                updateAction(idx, { apiConfig: { ...action.apiConfig, responseMapping: newMappings } });
                              }}
                              placeholder="data.resultado"
                              style={{ flex: 1, padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem' }}
                            />
                            <span style={{ alignSelf: 'center', color: '#64748b' }}>→</span>
                            <select
                              value={mapping.targetFieldId}
                              onChange={(e) => {
                                const newMappings = [...(action.apiConfig?.responseMapping || [])];
                                newMappings[mIdx] = { ...newMappings[mIdx], targetFieldId: e.target.value };
                                updateAction(idx, { apiConfig: { ...action.apiConfig, responseMapping: newMappings } });
                              }}
                              style={{ flex: 1, padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem' }}
                            >
                              <option value="">Seleccionar campo...</option>
                              {availableFields.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
              <button
                              onClick={() => {
                                const newMappings = (action.apiConfig?.responseMapping || []).filter((_: any, i: number) => i !== mIdx);
                                updateAction(idx, { apiConfig: { ...action.apiConfig, responseMapping: newMappings } });
                              }}
                              style={{ padding: '0.4rem 0.6rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                              ✕
              </button>
          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newMappings = [...(action.apiConfig?.responseMapping || []), { jsonPath: '', targetFieldId: '' }];
                            updateAction(idx, { apiConfig: { ...action.apiConfig, responseMapping: newMappings } });
                          }}
                          style={{ padding: '0.3rem 0.6rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', marginTop: '0.25rem' }}
                        >
                          ➕ Agregar Mapeo
        </button>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem' }}>
                          💡 El path usa notación de puntos: "data.usuario.nombre" extrae el nombre de {"{ data: { usuario: { nombre: 'valor' } } }"}
        </div>
        </div>

                      {/* Timeout */}
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <label style={{ fontSize: '0.8rem', color: '#475569' }}>
                          Timeout (ms):
        </label>
          <input
                          type="number"
                          value={action.apiConfig?.timeout || 30000}
                          onChange={(e) => updateAction(idx, { 
                            apiConfig: { ...action.apiConfig, timeout: parseInt(e.target.value) }
                          })}
                          min={1000}
                          max={120000}
                          style={{ width: '100px', padding: '0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', fontSize: '0.85rem' }}
                        />
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          (1000 - 120000)
                        </span>
          </div>
        </div>
                  )}

                  {action.type === 'set-value' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select
                        value={action.setValueConfig?.targetFieldId || ''}
                        onChange={(e) => updateAction(idx, {
                          setValueConfig: { ...action.setValueConfig, targetFieldId: e.target.value, valueType: action.setValueConfig?.valueType || 'static', value: action.setValueConfig?.value || '' }
                        })}
                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      >
                        <option value="">Seleccionar campo destino...</option>
                        {availableFields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={action.setValueConfig?.value || ''}
                        onChange={(e) => updateAction(idx, {
                          setValueConfig: { ...action.setValueConfig, value: e.target.value, targetFieldId: action.setValueConfig?.targetFieldId || '', valueType: 'static' }
                        })}
                        placeholder="Valor a asignar"
                        style={{ flex: 1, padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
        </div>
                  )}

                  {action.type === 'show-message' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <input
              type="text"
                        value={action.showMessageConfig?.title || ''}
                        onChange={(e) => updateAction(idx, {
                          showMessageConfig: { ...action.showMessageConfig, title: e.target.value, message: action.showMessageConfig?.message || '', type: action.showMessageConfig?.type || 'info' }
                        })}
                        placeholder="Título del mensaje"
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                      <input
                        type="text"
                        value={action.showMessageConfig?.message || ''}
                        onChange={(e) => updateAction(idx, {
                          showMessageConfig: { ...action.showMessageConfig, message: e.target.value, title: action.showMessageConfig?.title || '', type: action.showMessageConfig?.type || 'info' }
                        })}
                        placeholder="Contenido del mensaje"
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
            <select
                        value={action.showMessageConfig?.type || 'info'}
                        onChange={(e) => updateAction(idx, {
                          showMessageConfig: { ...action.showMessageConfig, type: e.target.value as any, title: action.showMessageConfig?.title || '', message: action.showMessageConfig?.message || '' }
                        })}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      >
                        <option value="info">ℹ️ Información</option>
                        <option value="success">✅ Éxito</option>
                        <option value="warning">⚠️ Advertencia</option>
                        <option value="error">❌ Error</option>
            </select>
          </div>
                  )}

                  {action.type === 'open-url' && (
                    <input
                      type="text"
                      value={action.openUrlConfig?.url || ''}
                      onChange={(e) => updateAction(idx, {
                        openUrlConfig: { url: e.target.value, openIn: 'new-tab' }
                      })}
                      placeholder="https://ejemplo.com"
                      style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                    />
                  )}

                  {/* COPIAR - Configuración */}
                  {action.type === 'copy' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#475569' }}>Campo a copiar al portapapeles:</label>
            <select
                        value={action.copyConfig?.sourceFieldId || ''}
                        onChange={(e) => updateAction(idx, {
                          copyConfig: { sourceFieldId: e.target.value }
                        })}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      >
                        <option value="">Seleccionar campo...</option>
                        {availableFields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
            </select>
          </div>
                  )}

                  {/* CALCULAR - Configuración */}
                  {action.type === 'calculate' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#475569' }}>
                        Fórmula (usa {'{'}campo{'}'} para valores):
            </label>
            <input
              type="text"
                        value={action.calculateConfig?.formula || ''}
                        onChange={(e) => updateAction(idx, {
                          calculateConfig: { 
                            ...action.calculateConfig, 
                            formula: e.target.value,
                            targetFieldId: action.calculateConfig?.targetFieldId || ''
                          }
                        })}
                        placeholder="Ej: {precio} * {cantidad}"
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontFamily: 'monospace' }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {availableFields.map(f => (
                          <span
                            key={f.id}
                            onClick={() => {
                              const formula = (action.calculateConfig?.formula || '') + `{${f.name}}`;
                              updateAction(idx, {
                                calculateConfig: { 
                                  ...action.calculateConfig, 
                                  formula,
                                  targetFieldId: action.calculateConfig?.targetFieldId || ''
                                }
                              });
                            }}
                            style={{
                              padding: '0.2rem 0.5rem',
                              background: '#e0f2fe',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: '#0369a1',
                              cursor: 'pointer'
                            }}
                            title="Clic para agregar"
                          >
                            {'{' + f.name + '}'}
                          </span>
                        ))}
          </div>
                      <label style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.5rem' }}>
                        Campo destino (donde poner el resultado):
            </label>
                      <select
                        value={action.calculateConfig?.targetFieldId || ''}
                        onChange={(e) => updateAction(idx, {
                          calculateConfig: { 
                            ...action.calculateConfig, 
                            targetFieldId: e.target.value,
                            formula: action.calculateConfig?.formula || ''
                          }
                        })}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      >
                        <option value="">Seleccionar campo destino...</option>
                        {availableFields.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
          </div>
                  )}

                  {/* MOSTRAR/OCULTAR - Configuración */}
                  {action.type === 'show-hide' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#475569' }}>Campo a mostrar/ocultar:</label>
            <select
                        value={action.showHideConfig?.targetFieldId || ''}
                        onChange={(e) => updateAction(idx, {
                          showHideConfig: { 
                            targetFieldId: e.target.value,
                            action: action.showHideConfig?.action || 'toggle'
                          }
                        })}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
            >
              <option value="">Seleccionar campo...</option>
              {availableFields.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
                      <label style={{ fontSize: '0.85rem', color: '#475569', marginTop: '0.25rem' }}>Acción:</label>
            <select
                        value={action.showHideConfig?.action || 'toggle'}
                        onChange={(e) => updateAction(idx, {
                          showHideConfig: { 
                            targetFieldId: action.showHideConfig?.targetFieldId || '',
                            action: e.target.value as 'show' | 'hide' | 'toggle'
                          }
                        })}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      >
                        <option value="show">👁️ Mostrar</option>
                        <option value="hide">🙈 Ocultar</option>
                        <option value="toggle">🔄 Alternar (toggle)</option>
            </select>
          </div>
                  )}

                  {/* VALIDAR - Configuración */}
                  {action.type === 'validate' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#475569' }}>Mensaje si falla la validación:</label>
            <input
              type="text"
                        value={action.validateConfig?.errorMessage || ''}
                        onChange={(e) => updateAction(idx, {
                          validateConfig: { 
                            errorMessage: e.target.value,
                            stopOnError: action.validateConfig?.stopOnError ?? true
                          }
                        })}
                        placeholder="Por favor complete todos los campos requeridos"
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                        <input
                          type="checkbox"
                          checked={action.validateConfig?.stopOnError ?? true}
                          onChange={(e) => updateAction(idx, {
                            validateConfig: { 
                              errorMessage: action.validateConfig?.errorMessage || '',
                              stopOnError: e.target.checked
                            }
                          })}
                        />
                        Detener acciones si hay error
                      </label>
          </div>
                  )}

                  {/* NAVEGAR - Configuración */}
                  {action.type === 'navigate' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem', color: '#475569' }}>Destino:</label>
                      <select
                        value={action.navigateConfig?.target || 'dashboard'}
                        onChange={(e) => updateAction(idx, {
                          navigateConfig: { target: e.target.value as 'dashboard' | 'back' | 'custom', customPath: action.navigateConfig?.customPath }
                        })}
                        style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                      >
                        <option value="dashboard">🏠 Ir al Dashboard</option>
                        <option value="back">⬅️ Volver atrás</option>
                        <option value="custom">📄 Ruta personalizada</option>
                      </select>
                      {action.navigateConfig?.target === 'custom' && (
          <input
            type="text"
                          value={action.navigateConfig?.customPath || ''}
                          onChange={(e) => updateAction(idx, {
                            navigateConfig: { target: 'custom', customPath: e.target.value }
                          })}
                          placeholder="/ruta/personalizada"
                          style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px' }}
                        />
                      )}
        </div>
                  )}

                  {/* IMPRIMIR - Configuración */}
                  {action.type === 'print' && (
                    <div style={{ padding: '0.5rem', background: '#f0fdf4', borderRadius: '6px', color: '#166534', fontSize: '0.85rem' }}>
                      🖨️ Se imprimirá el formulario actual con todos los valores completados.
                    </div>
                  )}

                  {/* LIMPIAR FORMULARIO - Configuración */}
                  {action.type === 'clear-form' && (
                    <div style={{ padding: '0.5rem', background: '#fef3c7', borderRadius: '6px', color: '#92400e', fontSize: '0.85rem' }}>
                      🗑️ Se borrarán todos los valores de los campos del formulario.
        </div>
                  )}

                  {/* ENVIAR FORMULARIO - Configuración */}
                  {action.type === 'submit-form' && (
                    <div style={{ padding: '0.5rem', background: '#e0f2fe', borderRadius: '6px', color: '#0369a1', fontSize: '0.85rem' }}>
                      📤 Se enviarán los datos del formulario a la API configurada en el template.
          </div>
                  )}
                </div>
              ))}
            </div>
          )}
          </div>

        {/* Agregar nueva acción */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#475569' }}>
            Agregar acción:
            </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {Object.entries(ACTION_TYPES_INFO).map(([type, info]) => (
              <button
                key={type}
                onClick={() => addAction(type as ActionType)}
              style={{
                  padding: '0.5rem 0.75rem',
                border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
                title={info.description}
              >
                {info.icon} {info.label}
              </button>
            ))}
          </div>
          </div>
        </div>
      );
  };

      return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          width: '95%',
          maxWidth: '900px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          borderRadius: '16px 16px 0 0'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.25rem' }}>
              {editingControl ? '✏️ Editar Control' : '➕ Crear Nuevo Control'}
            </h2>
            {control && (
              <p style={{ margin: '0.25rem 0 0', color: '#64748b', fontSize: '0.9rem' }}>
                {CONTROL_TYPES_INFO[control.type].icon} {CONTROL_TYPES_INFO[control.type].label}
              </p>
            )}
        </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Tabs de navegación */}
        {control && (
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #e5e7eb',
            backgroundColor: '#fafafa'
          }}>
            <button
              onClick={() => setStep('config')}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: step === 'config' ? 'white' : 'transparent',
                borderBottom: step === 'config' ? '2px solid #3b82f6' : 'none',
                cursor: 'pointer',
                fontWeight: step === 'config' ? '600' : '400',
                color: step === 'config' ? '#3b82f6' : '#64748b'
              }}
            >
              ⚙️ Configuración
            </button>
            <button
              onClick={() => setStep('actions')}
              style={{
                padding: '1rem 1.5rem',
                border: 'none',
                background: step === 'actions' ? 'white' : 'transparent',
                borderBottom: step === 'actions' ? '2px solid #3b82f6' : 'none',
                cursor: 'pointer',
                fontWeight: step === 'actions' ? '600' : '400',
                color: step === 'actions' ? '#3b82f6' : '#64748b'
              }}
            >
              ⚡ Acciones ({Object.values(control.actions).flat().length})
            </button>
        </div>
        )}

        {/* Contenido */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {step === 'type' && renderTypeSelection()}
          {step === 'config' && renderControlConfig()}
          {step === 'actions' && renderActionsConfig()}
        </div>

        {/* Footer con botones */}
        {control && (
          <div style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            backgroundColor: '#f8fafc',
            borderRadius: '0 0 16px 16px'
          }}>
            <button
              onClick={() => {
                if (step === 'config') {
                  setControl(null);
                  setStep('type');
                } else {
                  setStep('config');
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                background: 'white',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              ← {step === 'config' ? 'Cambiar tipo' : 'Volver a configuración'}
            </button>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={onClose}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: 'white',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '8px',
                  background: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                💾 {editingControl ? 'Guardar cambios' : 'Crear control'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlCreatorModal;
