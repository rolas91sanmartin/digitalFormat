# 🎨 Guía de Implementación - Editor Visual Completo

## ✅ Lo que YA está implementado:

### 1. **Modelo de Datos Actualizado** ✅
- ✅ `StaticElement` - Para textos, líneas, rectángulos, logos
- ✅ `FormField` - Campos editables con estilos completos
- ✅ `TableDefinition` - Tablas dinámicas con columnas
- ✅ `FormTemplate` con `renderMode`: 'hybrid' | 'html-only' | 'image-overlay'

### 2. **Servicio de OpenAI Mejorado** ✅
- ✅ Prompt super detallado que detecta TODOS los elementos
- ✅ Retorna `staticElements`, `fields` y `tables`
- ✅ Estilos completos para cada elemento

---

## 🚧 Lo que FALTA implementar:

### 3. **Actualizar Base de Datos SQLite**

#### Modificar `src/infrastructure/database/DatabaseConnection.ts`:

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS form_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    userId TEXT NOT NULL,
    backgroundImage TEXT NOT NULL,
    
    -- Nuevos campos
    staticElements TEXT NOT NULL,  -- JSON de elementos estáticos
    fields TEXT NOT NULL,           -- JSON de campos
    tables TEXT NOT NULL,           -- JSON de tablas
    renderMode TEXT DEFAULT 'hybrid', -- hybrid, html-only, image-overlay
    
    pageWidth INTEGER NOT NULL,
    pageHeight INTEGER NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
  )
`);
```

#### Modificar `src/infrastructure/repositories/SQLiteFormTemplateRepository.ts`:

```typescript
async create(templateData: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<FormTemplate> {
  const id = randomUUID();
  const now = new Date().toISOString();

  const stmt = this.db.prepare(`
    INSERT INTO form_templates (
      id, name, description, userId, backgroundImage, 
      staticElements, fields, tables, renderMode,
      pageWidth, pageHeight, createdAt, updatedAt
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    templateData.name,
    templateData.description || null,
    templateData.userId,
    templateData.backgroundImage,
    JSON.stringify(templateData.staticElements),
    JSON.stringify(templateData.fields),
    JSON.stringify(templateData.tables),
    templateData.renderMode || 'hybrid',
    templateData.pageSize.width,
    templateData.pageSize.height,
    now,
    now
  );

  return {
    id,
    ...templateData,
    createdAt: new Date(now),
    updatedAt: new Date(now)
  };
}
```

---

### 4. **Crear Componente Editor Visual**

#### `src/renderer/src/components/FormTemplateEditor.tsx`:

```typescript
import React, { useState } from 'react';
import { FormTemplate, StaticElement, FormField, TableDefinition } from '../types';
import PropertiesPanel from './PropertiesPanel';
import FormRenderer from './FormRenderer';

interface FormTemplateEditorProps {
  template: FormTemplate;
  onSave: (template: FormTemplate) => void;
}

const FormTemplateEditor: React.FC<FormTemplateEditorProps> = ({ template, onSave }) => {
  const [editedTemplate, setEditedTemplate] = useState<FormTemplate>(template);
  const [selectedElement, setSelectedElement] = useState<{
    type: 'static' | 'field' | 'table';
    id: string;
  } | null>(null);
  const [showImageBackground, setShowImageBackground] = useState(true);

  const handleElementClick = (type: 'static' | 'field' | 'table', id: string) => {
    setSelectedElement({ type, id });
  };

  const handleUpdateElement = (updates: any) => {
    if (!selectedElement) return;

    setEditedTemplate(prev => {
      const updated = { ...prev };
      
      if (selectedElement.type === 'static') {
        updated.staticElements = updated.staticElements.map(el =>
          el.id === selectedElement.id ? { ...el, ...updates } : el
        );
      } else if (selectedElement.type === 'field') {
        updated.fields = updated.fields.map(field =>
          field.id === selectedElement.id ? { ...field, ...updates } : field
        );
      } else if (selectedElement.type === 'table') {
        updated.tables = updated.tables.map(table =>
          table.id === selectedElement.id ? { ...table, ...updates } : table
        );
      }
      
      return updated;
    });
  };

  return (
    <div className="form-editor-container">
      <div className="editor-toolbar">
        <button onClick={() => setShowImageBackground(!showImageBackground)}>
          {showImageBackground ? '👁️ Vista Limpia' : '🖼️ Mostrar Fondo'}
        </button>
        <button onClick={() => onSave(editedTemplate)}>💾 Guardar Cambios</button>
      </div>

      <div className="editor-workspace">
        {/* Panel Izquierdo: Árbol de elementos */}
        <div className="elements-tree">
          <h3>Elementos</h3>
          
          <div className="element-group">
            <h4>📝 Textos Estáticos</h4>
            {editedTemplate.staticElements.map(el => (
              <div 
                key={el.id}
                className={`element-item ${selectedElement?.id === el.id ? 'selected' : ''}`}
                onClick={() => handleElementClick('static', el.id)}
              >
                {el.type === 'text' ? el.content?.substring(0, 30) : el.type}
              </div>
            ))}
          </div>

          <div className="element-group">
            <h4>✏️ Campos Editables</h4>
            {editedTemplate.fields.map(field => (
              <div 
                key={field.id}
                className={`element-item ${selectedElement?.id === field.id ? 'selected' : ''}`}
                onClick={() => handleElementClick('field', field.id)}
              >
                {field.name}
              </div>
            ))}
          </div>

          <div className="element-group">
            <h4>📊 Tablas</h4>
            {editedTemplate.tables.map(table => (
              <div 
                key={table.id}
                className={`element-item ${selectedElement?.id === table.id ? 'selected' : ''}`}
                onClick={() => handleElementClick('table', table.id)}
              >
                Tabla ({table.columns.length} columnas)
              </div>
            ))}
          </div>
        </div>

        {/* Centro: Vista previa del formulario */}
        <FormRenderer 
          template={editedTemplate}
          showBackground={showImageBackground}
          onElementClick={handleElementClick}
          selectedElement={selectedElement}
        />

        {/* Panel Derecho: Propiedades */}
        <PropertiesPanel 
          element={getSelectedElement()}
          onUpdate={handleUpdateElement}
        />
      </div>
    </div>
  );

  function getSelectedElement() {
    if (!selectedElement) return null;
    
    if (selectedElement.type === 'static') {
      return editedTemplate.staticElements.find(el => el.id === selectedElement.id);
    } else if (selectedElement.type === 'field') {
      return editedTemplate.fields.find(field => field.id === selectedElement.id);
    } else {
      return editedTemplate.tables.find(table => table.id === selectedElement.id);
    }
  }
};

export default FormTemplateEditor;
```

---

### 5. **Panel de Propiedades**

#### `src/renderer/src/components/PropertiesPanel.tsx`:

```typescript
import React from 'react';

interface PropertiesPanelProps {
  element: any;
  onUpdate: (updates: any) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ element, onUpdate }) => {
  if (!element) {
    return (
      <div className="properties-panel empty">
        <p>Selecciona un elemento para editar sus propiedades</p>
      </div>
    );
  }

  const isStatic = element.type === 'text' || element.type === 'line' || element.type === 'rectangle';
  const isField = element.name !== undefined;

  return (
    <div className="properties-panel">
      <h3>✏️ Propiedades</h3>

      {/* POSICIÓN */}
      <div className="property-group">
        <h4>📍 Posición</h4>
        <label>
          X:
          <input 
            type="number" 
            value={element.position.x}
            onChange={(e) => onUpdate({ 
              position: { ...element.position, x: Number(e.target.value) }
            })}
          />
        </label>
        <label>
          Y:
          <input 
            type="number" 
            value={element.position.y}
            onChange={(e) => onUpdate({ 
              position: { ...element.position, y: Number(e.target.value) }
            })}
          />
        </label>
        <label>
          Ancho:
          <input 
            type="number" 
            value={element.position.width}
            onChange={(e) => onUpdate({ 
              position: { ...element.position, width: Number(e.target.value) }
            })}
          />
        </label>
        <label>
          Alto:
          <input 
            type="number" 
            value={element.position.height}
            onChange={(e) => onUpdate({ 
              position: { ...element.position, height: Number(e.target.value) }
            })}
          />
        </label>
      </div>

      {/* CONTENIDO (si es texto) */}
      {isStatic && element.type === 'text' && (
        <div className="property-group">
          <h4>📝 Contenido</h4>
          <textarea
            value={element.content || ''}
            onChange={(e) => onUpdate({ content: e.target.value })}
            rows={3}
          />
        </div>
      )}

      {/* ESTILOS DE TEXTO */}
      <div className="property-group">
        <h4>🎨 Estilos</h4>
        
        <label>
          Tamaño de Fuente:
          <input 
            type="number" 
            value={element.style?.fontSize || 12}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, fontSize: Number(e.target.value) }
            })}
          />
        </label>

        <label>
          Fuente:
          <select 
            value={element.style?.fontFamily || 'Arial'}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, fontFamily: e.target.value }
            })}
          >
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Verdana">Verdana</option>
            <option value="Georgia">Georgia</option>
          </select>
        </label>

        <label>
          Peso:
          <select 
            value={element.style?.fontWeight || 'normal'}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, fontWeight: e.target.value }
            })}
          >
            <option value="normal">Normal</option>
            <option value="bold">Negrita</option>
            <option value="bolder">Más Negrita</option>
          </select>
        </label>

        <label>
          Color del Texto:
          <input 
            type="color" 
            value={element.style?.color || '#000000'}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, color: e.target.value }
            })}
          />
        </label>

        <label>
          Color de Fondo:
          <input 
            type="color" 
            value={element.style?.backgroundColor || '#ffffff'}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, backgroundColor: e.target.value }
            })}
          />
        </label>

        <label>
          Alineación:
          <select 
            value={element.style?.textAlign || 'left'}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, textAlign: e.target.value }
            })}
          >
            <option value="left">Izquierda</option>
            <option value="center">Centro</option>
            <option value="right">Derecha</option>
            <option value="justify">Justificado</option>
          </select>
        </label>
      </div>

      {/* BORDES */}
      <div className="property-group">
        <h4>🔲 Bordes</h4>
        
        <label>
          Color del Borde:
          <input 
            type="color" 
            value={element.style?.borderColor || '#000000'}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, borderColor: e.target.value }
            })}
          />
        </label>

        <label>
          Grosor del Borde:
          <input 
            type="number" 
            value={element.style?.borderWidth || 1}
            min="0"
            max="10"
            onChange={(e) => onUpdate({ 
              style: { ...element.style, borderWidth: Number(e.target.value) }
            })}
          />
        </label>

        <label>
          Estilo del Borde:
          <select 
            value={element.style?.borderStyle || 'solid'}
            onChange={(e) => onUpdate({ 
              style: { ...element.style, borderStyle: e.target.value }
            })}
          >
            <option value="solid">Sólido</option>
            <option value="dashed">Discontinuo</option>
            <option value="dotted">Punteado</option>
            <option value="double">Doble</option>
            <option value="none">Ninguno</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default PropertiesPanel;
```

---

### 6. **Renderizador de Formularios**

#### `src/renderer/src/components/FormRenderer.tsx`:

```typescript
import React from 'react';
import { FormTemplate } from '../types';

interface FormRendererProps {
  template: FormTemplate;
  showBackground: boolean;
  onElementClick?: (type: 'static' | 'field' | 'table', id: string) => void;
  selectedElement?: { type: string; id: string } | null;
}

const FormRenderer: React.FC<FormRendererProps> = ({ 
  template, 
  showBackground, 
  onElementClick,
  selectedElement 
}) => {
  return (
    <div className="form-renderer">
      <div 
        className="form-canvas"
        style={{
          width: `${template.pageSize.width}px`,
          height: `${template.pageSize.height}px`,
          position: 'relative',
          backgroundImage: showBackground ? `url('${template.backgroundImage}')` : 'none',
          backgroundColor: showBackground ? 'transparent' : '#ffffff',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Renderizar elementos estáticos */}
        {template.staticElements.map(element => (
          <div
            key={element.id}
            className={`static-element ${selectedElement?.id === element.id ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: `${element.position.x}px`,
              top: `${element.position.y}px`,
              width: `${element.position.width}px`,
              height: `${element.position.height}px`,
              ...elementToStyle(element)
            }}
            onClick={() => onElementClick?.('static', element.id)}
          >
            {element.type === 'text' && element.content}
          </div>
        ))}

        {/* Renderizar campos */}
        {template.fields.map(field => (
          <div
            key={field.id}
            className={`form-field ${selectedElement?.id === field.id ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: `${field.position.x}px`,
              top: `${field.position.y}px`,
              width: `${field.position.width}px`,
              height: `${field.position.height}px`,
              ...fieldToStyle(field)
            }}
            onClick={() => onElementClick?.('field', field.id)}
          >
            <input 
              type={field.type === 'textarea' ? 'text' : field.type}
              placeholder={field.placeholder}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        ))}

        {/* Renderizar tablas */}
        {template.tables.map(table => (
          <div
            key={table.id}
            className={`form-table ${selectedElement?.id === table.id ? 'selected' : ''}`}
            style={{
              position: 'absolute',
              left: `${table.position.x}px`,
              top: `${table.position.y}px`,
              width: `${table.position.width}px`
            }}
            onClick={() => onElementClick?.('table', table.id)}
          >
            <table style={{ width: '100%', ...tableToStyle(table) }}>
              <thead>
                <tr>
                  {table.columns.map(col => (
                    <th key={col.id} style={{ width: `${col.width}px` }}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: table.minRows }).map((_, idx) => (
                  <tr key={idx}>
                    {table.columns.map(col => (
                      <td key={col.id}>
                        <input type={col.type} style={{ width: '100%' }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
};

// Helpers para convertir estilos
function elementToStyle(element: any): React.CSSProperties {
  return {
    fontSize: `${element.style?.fontSize || 12}px`,
    fontFamily: element.style?.fontFamily || 'Arial',
    fontWeight: element.style?.fontWeight || 'normal',
    color: element.style?.color || '#000000',
    backgroundColor: element.style?.backgroundColor || 'transparent',
    border: element.style?.borderWidth 
      ? `${element.style.borderWidth}px ${element.style.borderStyle || 'solid'} ${element.style.borderColor || '#000000'}`
      : 'none',
    textAlign: element.style?.textAlign as any || 'left',
    padding: `${element.style?.padding || 0}px`,
    display: 'flex',
    alignItems: 'center'
  };
}

function fieldToStyle(field: any): React.CSSProperties {
  return elementToStyle(field);
}

function tableToStyle(table: any): React.CSSProperties {
  return {
    borderCollapse: 'collapse',
    fontSize: `${table.style?.fontSize || 11}px`,
    fontFamily: table.style?.fontFamily || 'Arial',
    border: `${table.style?.borderWidth || 1}px solid ${table.style?.borderColor || '#000000'}`
  };
}

export default FormRenderer;
```

---

## 📝 PASOS PARA COMPLETAR LA IMPLEMENTACIÓN:

### 1. Actualizar base de datos
- Ejecutar el script de migración para agregar nuevas columnas
- Actualizar repositorio SQLite

### 2. Actualizar caso de uso `CreateFormTemplate`
- Ya detecta staticElements, fields y tables
- Solo asegurar que guarda el `renderMode: 'hybrid'`

### 3. Crear los componentes del editor
- `FormTemplateEditor.tsx` - Componente principal
- `PropertiesPanel.tsx` - Panel de propiedades editable
- `FormRenderer.tsx` - Renderizador visual

### 4. Actualizar la página `FormEditor.tsx`
- Reemplazar el editor simple actual con el nuevo `FormTemplateEditor`
- Agregar botón de "Guardar Cambios"

### 5. Estilos CSS
- Crear `FormTemplateEditor.css` con estilos para el editor
- Agregar clase `.selected` para elementos seleccionados
- Estilos para el panel de propiedades

---

## 🎯 RESULTADO FINAL:

El usuario podrá:
1. ✅ Subir una imagen del formulario
2. ✅ La IA detecta TODO (textos, campos, tablas, estilos)
3. ✅ Ver el formulario en modo híbrido (con/sin imagen de fondo)
4. ✅ Seleccionar cualquier elemento
5. ✅ Editar todas sus propiedades en el panel derecho
6. ✅ Guardar los cambios en la base de datos
7. ✅ Imprimir el formulario recreado en HTML puro

---

¿Quieres que continue implementando estos componentes o prefieres hacerlo tú siguiendo esta guía?

