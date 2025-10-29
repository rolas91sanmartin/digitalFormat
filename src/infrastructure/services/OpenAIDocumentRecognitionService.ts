import OpenAI from 'openai';
import { IDocumentRecognitionService, DocumentAnalysisResult } from '../../domain/services/IDocumentRecognitionService';
import { FormField } from '../../domain/entities/FormTemplate';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

export class OpenAIDocumentRecognitionService implements IDocumentRecognitionService {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async analyzeDocument(fileBuffer: Buffer, fileType: 'pdf' | 'image'): Promise<DocumentAnalysisResult> {
    let base64Image: string;
    let pageSize = { width: 816, height: 1056 }; // Tamaño A4 por defecto en píxeles (96 DPI)

    if (fileType === 'pdf') {
      // PDFs temporalmente deshabilitados debido a problemas de compatibilidad con Electron
      throw new Error('Los archivos PDF aún no están soportados debido a limitaciones técnicas. Por favor:\n\n1. Abre tu PDF\n2. Toma una captura de pantalla (Win + Shift + S en Windows)\n3. Guarda como JPG o PNG\n4. Sube la imagen aquí\n\nEstamos trabajando en soporte nativo de PDF.');
    }

    // Detectar el tipo de imagen basado en los magic numbers
    const mimeType = this.detectImageMimeType(fileBuffer);
    base64Image = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    
    // Obtener dimensiones reales de la imagen y normalizar a A4
    try {
      const metadata = await sharp(fileBuffer).metadata();
      if (metadata.width && metadata.height) {
        // Normalizar a formato A4 si es necesario
        const aspectRatio = metadata.width / metadata.height;
        const a4AspectRatio = 210 / 297; // Ratio A4 (0.707)
        
        // Si el ratio es cercano a A4 (± 10%), usar dimensiones A4 estándar
        if (Math.abs(aspectRatio - a4AspectRatio) < 0.1) {
          // A4 a 96 DPI: 794 x 1123 px (210mm x 297mm)
          pageSize = { width: 794, height: 1123 };
        } else {
          // Usar dimensiones originales pero escalarlas para que no excedan A4
          const maxWidth = 794;
          const maxHeight = 1123;
          
          if (metadata.width > maxWidth || metadata.height > maxHeight) {
            const scale = Math.min(maxWidth / metadata.width, maxHeight / metadata.height);
            pageSize = { 
              width: Math.round(metadata.width * scale), 
              height: Math.round(metadata.height * scale) 
            };
          } else {
            pageSize = { width: metadata.width, height: metadata.height };
          }
        }
      }
    } catch (error) {
      console.warn('No se pudieron obtener las dimensiones de la imagen, usando tamaño A4 por defecto');
      pageSize = { width: 794, height: 1123 }; // A4 estándar
    }

    // Analizar con GPT-4 Vision
    const analysis = await this.analyzeWithGPT4Vision(base64Image, pageSize);

    return {
      staticElements: analysis.staticElements,
      fields: analysis.fields,
      tables: analysis.tables,
      pageSize,
      backgroundImage: base64Image
    };
  }

  // Método deshabilitado temporalmente - PDFs no soportados por problemas de compatibilidad ESM/CommonJS
  // TODO: Implementar conversión de PDF usando una librería compatible con Electron
  // Opciones futuras: pdf-lib, node-poppler, o solución custom con canvas nativo

  private detectImageMimeType(buffer: Buffer): string {
    // Detectar tipo de imagen por los magic numbers
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
      return 'image/webp';
    }
    // Por defecto, asumir JPEG
    return 'image/jpeg';
  }

  private async analyzeWithGPT4Vision(base64Image: string, pageSize: { width: number; height: number }): Promise<{
    staticElements: any[];
    fields: any[];
    tables: any[];
  }> {
    const prompt = `Analiza este formulario y extrae los elementos para recrearlo.

**Dimensiones de la imagen: ${pageSize.width}x${pageSize.height} píxeles**

**Instrucciones:**
- La esquina superior izquierda es (0,0)
- Mide las coordenadas en píxeles desde esa esquina
- X va de izquierda a derecha (0 a ${pageSize.width})
- Y va de arriba a abajo (0 a ${pageSize.height})

**Identifica:**

1. **Elementos estáticos**: Textos impresos, títulos, etiquetas (NO espacios en blanco)
2. **Campos editables**: Líneas o espacios donde se puede escribir
3. **Tablas**: Estructuras con columnas y filas

Devuelve JSON con este formato:
{
  "staticElements": [{"type": "text", "content": "texto", "position": {"x": 50, "y": 30, "width": 200, "height": 25}, "style": {"fontSize": 14, "fontWeight": "bold", "color": "#000000"}}],
  "fields": [{"name": "proveedor", "type": "text", "position": {"x": 100, "y": 200, "width": 300, "height": 30}, "style": {"fontSize": 12}, "placeholder": "Nombre", "required": true}],
  "tables": [{"position": {"x": 50, "y": 400, "width": 700, "height": 250}, "columns": [{"header": "No.", "width": 60, "type": "text"}, {"header": "DESCRIPCIÓN", "width": 400, "type": "text"}], "minRows": 6, "maxRows": 20, "rowHeight": 35, "style": {"fontSize": 11, "borderWidth": 1, "borderColor": "#000000"}}]
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      });

      const content = response.choices[0].message.content;
      if (!content) {
        throw new Error('No se recibió respuesta de OpenAI');
      }

      const result = JSON.parse(content);
      
      // Asignar IDs únicos a elementos estáticos
      const staticElements = (result.staticElements || []).map((element: any) => ({
        id: randomUUID(),
        type: element.type,
        content: element.content,
        position: element.position,
        style: {
          ...element.style,
          fontSize: element.style?.fontSize || 12,
          fontFamily: element.style?.fontFamily || 'Arial',
          color: element.style?.color || '#000000'
        }
      }));

      // Asignar IDs únicos a campos
      const fields = (result.fields || []).map((field: any) => ({
        id: randomUUID(),
        name: field.name,
        type: field.type || 'text',
        position: field.position,
        style: {
          ...field.style,
          fontSize: field.style?.fontSize || 12,
          fontFamily: field.style?.fontFamily || 'Arial',
          color: field.style?.color || '#000000'
        },
        placeholder: field.placeholder,
        required: field.required || false,
        defaultValue: field.defaultValue || ''
      }));

      // Asignar IDs únicos a tablas y sus columnas
      const tables = (result.tables || []).map((table: any) => ({
        id: randomUUID(),
        position: table.position,
        columns: (table.columns || []).map((col: any) => ({
          id: randomUUID(),
          header: col.header,
          width: col.width,
          type: col.type || 'text'
        })),
        minRows: table.minRows || 1,
        maxRows: table.maxRows || 50,
        rowHeight: table.rowHeight || 30,
        style: {
          ...table.style,
          fontSize: table.style?.fontSize || 11,
          fontFamily: table.style?.fontFamily || 'Arial'
        }
      }));

      return {
        staticElements,
        fields,
        tables
      };
    } catch (error) {
      console.error('Error al analizar documento con OpenAI:', error);
      throw new Error('Error al analizar el documento. Verifica tu API Key de OpenAI.');
    }
  }
}

