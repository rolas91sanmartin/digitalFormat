import { IFormTemplateRepository } from '../../../domain/repositories/IFormTemplateRepository';
import { IFormSequenceRepository } from '../../../domain/repositories/IFormSequenceRepository';
import { ISubmittedFormRepository } from '../../../domain/repositories/ISubmittedFormRepository';
import { FormTemplate, ApiConfiguration, FieldMapping } from '../../../domain/entities/FormTemplate';

export interface SubmitFormDataDTO {
  templateId: string;
  userId: string;
  values: Record<string, any>;
}

export interface SubmitFormDataResult {
  success: boolean;
  formNumber?: string;
  apiResponse?: any;
  error?: string;
  submittedFormId?: string;
}

export class SubmitFormData {
  constructor(
    private formTemplateRepository: IFormTemplateRepository,
    private formSequenceRepository: IFormSequenceRepository,
    private submittedFormRepository: ISubmittedFormRepository
  ) {}

  async execute(data: SubmitFormDataDTO): Promise<SubmitFormDataResult> {
    try {
      // 1. Obtener template con configuración
      const template = await this.formTemplateRepository.findById(data.templateId);
      if (!template) {
        return { success: false, error: 'Plantilla no encontrada' };
      }

      // 2. Generar número de folio (si está habilitado)
      let formNumber = '';
      if (template.numerationConfig?.enabled) {
        try {
          formNumber = await this.generateFormNumber(template);
          // Agregar el número al campo correspondiente
          if (template.numerationConfig.fieldId) {
            data.values[template.numerationConfig.fieldId] = formNumber;
          }
        } catch (error: any) {
          return { success: false, error: `Error generando número: ${error.message}` };
        }
      }

      // 3. Validar campos requeridos
      if (template.apiConfiguration?.beforeSend?.validateRequired) {
        const validation = this.validateRequiredFields(template, data.values);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
      }

      // 4. Guardar en base de datos local
      const submittedForm = await this.submittedFormRepository.create({
        templateId: data.templateId,
        submittedBy: data.userId,
        formNumber,
        fieldValues: data.values,
        apiStatus: template.apiConfiguration?.enabled ? 'pending' : undefined
      });

      // 5. Enviar a API (si está habilitada)
      if (template.apiConfiguration?.enabled) {
        try {
          // Mapear campos según configuración
          const mappedData = this.mapFieldsToApi(template, data.values);

          // Enviar a API
          const apiResponse = await this.sendToApi(template.apiConfiguration, mappedData);

          // Actualizar con respuesta exitosa
          await this.submittedFormRepository.update(submittedForm.id, {
            apiResponse,
            apiStatus: 'success'
          });

          return {
            success: true,
            formNumber,
            apiResponse,
            submittedFormId: submittedForm.id
          };
        } catch (error: any) {
          // Actualizar con error
          await this.submittedFormRepository.update(submittedForm.id, {
            apiStatus: 'error',
            apiError: error.message
          });

          if (template.apiConfiguration.onError?.retryable) {
            // Los datos están guardados, se pueden reintentar después
            return {
              success: true, // Éxito parcial - guardado localmente
              formNumber,
              error: `Guardado localmente. Error al enviar a API: ${error.message}`,
              submittedFormId: submittedForm.id
            };
          }

          return {
            success: false,
            error: `Error al enviar a API: ${error.message}`
          };
        }
      }

      // Sin API configurada, solo guardado local
      return {
        success: true,
        formNumber,
        submittedFormId: submittedForm.id
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Error desconocido al enviar formulario'
      };
    }
  }

  private async generateFormNumber(template: FormTemplate): Promise<string> {
    const config = template.numerationConfig!;

    // Obtener último número usado
    let sequence = await this.formSequenceRepository.findByTemplateId(template.id);
    if (!sequence) {
      sequence = await this.formSequenceRepository.create({
        templateId: template.id,
        lastNumber: config.startFrom || 0
      });
    }

    // Incrementar
    const nextNumber = sequence.lastNumber + 1;
    await this.formSequenceRepository.update(template.id, nextNumber);

    // Formatear según tipo
    switch (config.type) {
      case 'sequential':
        return `${config.prefix || ''}${nextNumber.toString().padStart(config.padding, '0')}${config.suffix || ''}`;

      case 'date-based': {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `${config.prefix || ''}${dateStr}-${nextNumber.toString().padStart(config.padding, '0')}${config.suffix || ''}`;
      }

      case 'custom':
        return this.applyCustomPattern(config.customPattern!, {
          prefix: config.prefix || '',
          suffix: config.suffix || '',
          seq: nextNumber.toString().padStart(config.padding, '0'),
          date: new Date().toISOString().slice(0, 10).replace(/-/g, '')
        });

      default:
        return nextNumber.toString();
    }
  }

  private applyCustomPattern(pattern: string, vars: Record<string, string>): string {
    let result = pattern;
    Object.entries(vars).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    });
    return result;
  }

  private validateRequiredFields(template: FormTemplate, values: Record<string, any>): { valid: boolean; error?: string } {
    // Validar campos requeridos definidos en el template
    const requiredFields = template.fields?.filter(field => field.required);
    
    for (const field of requiredFields || []) {
      const value = values[field.id];
      if (value === undefined || value === null || value === '') {
        return {
          valid: false,
          error: `El campo "${field.name}" es requerido`
        };
      }
    }

    // Validar campos requeridos en los mapeos
    if (template.fieldMappings) {
      for (const mapping of template.fieldMappings) {
        if (mapping.required) {
          const value = values[mapping.fieldId];
          if (value === undefined || value === null || value === '') {
            const fieldName = template.fields?.find(f => f.id === mapping.fieldId)?.name || mapping.fieldId;
            return {
              valid: false,
              error: `El campo "${fieldName}" es requerido`
            };
          }
        }
      }
    }

    return { valid: true };
  }

  private mapFieldsToApi(template: FormTemplate, values: Record<string, any>): any {
    const dataFormat = template.apiConfiguration?.dataFormat || 'structured';

    // Mapear campos
    const mappedFields: any = {};
    if (template.fieldMappings && template.fieldMappings.length > 0) {
      template.fieldMappings.forEach(mapping => {
        let value = values[mapping.fieldId];

        // Aplicar valor por defecto si no hay valor
        if ((value === undefined || value === null || value === '') && mapping.defaultValue !== undefined) {
          value = mapping.defaultValue;
        }

        // Aplicar transformación si existe
        if (mapping.transform && value !== undefined && value !== null) {
          value = this.transformValue(value, mapping.transform);
        }

        mappedFields[mapping.apiKey] = value;
      });
    }

    // Mapear tablas
    const mappedTables: any = {};
    if (template.tableMappings && template.tableMappings.length > 0 && template.tables) {
      template.tableMappings.forEach(tableMapping => {
        if (!tableMapping.enabled) return;

        const table = template.tables?.find(t => t.id === tableMapping.tableId);
        if (!table) return;

        // Extraer filas de la tabla desde values
        const tableRows: any[] = [];
        let rowIndex = 0;
        let hasMoreRows = true;

        while (hasMoreRows) {
          const row: any = {};
          let hasData = false;

          tableMapping.columnMappings.forEach(colMapping => {
            const cellKey = `${tableMapping.tableId}_${colMapping.columnId}_row${rowIndex}`;
            let cellValue = values[cellKey];

            if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
              hasData = true;
              // Aplicar transformación si existe
              if (colMapping.transform && colMapping.transform.type !== 'none') {
                cellValue = this.transformValue(cellValue, colMapping.transform);
              }
            }

            row[colMapping.apiKey] = cellValue || '';
          });

          if (hasData) {
            tableRows.push(row);
            rowIndex++;
          } else {
            hasMoreRows = false;
          }
        }

        mappedTables[tableMapping.apiKey] = tableRows;
      });
    }

    // Construir JSON según el formato
    if (dataFormat === 'structured') {
      // Formato estructurado: metadata, fields, tables
      return {
        metadata: {
          formNumber: values[template.numerationConfig?.fieldId || ''] || '',
          templateId: template.id,
          templateName: template.name,
          submittedAt: new Date().toISOString()
        },
        fields: mappedFields,
        tables: mappedTables
      };
    } else if (dataFormat === 'flat') {
      // Formato plano: todo al mismo nivel
      const flatData: any = {
        folio: values[template.numerationConfig?.fieldId || ''] || '',
        fecha_envio: new Date().toISOString(),
        ...mappedFields
      };

      // Agregar tablas con sufijo _items
      Object.entries(mappedTables).forEach(([key, value]) => {
        flatData[`${key}_items`] = value;
      });

      return flatData;
    } else {
      // custom - por ahora retornar structured
      return {
        metadata: {
          formNumber: values[template.numerationConfig?.fieldId || ''] || '',
          templateId: template.id,
          templateName: template.name,
          submittedAt: new Date().toISOString()
        },
        fields: mappedFields,
        tables: mappedTables
      };
    }
  }

  private transformValue(value: any, transform: FieldMapping['transform']): any {
    if (!transform) return value;

    const strValue = String(value);

    switch (transform.type) {
      case 'uppercase':
        return strValue.toUpperCase();
      case 'lowercase':
        return strValue.toLowerCase();
      case 'trim':
        return strValue.trim();
      case 'none':
      default:
        return value;
    }
  }

  private async sendToApi(config: ApiConfiguration, data: any): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    // Agregar autenticación
    if (config.authentication && config.authentication.type !== 'none') {
      switch (config.authentication.type) {
        case 'bearer':
          if (config.authentication.token) {
            headers['Authorization'] = `Bearer ${config.authentication.token}`;
          }
          break;
        case 'apikey':
          if (config.authentication.apiKey && config.authentication.apiKeyHeader) {
            headers[config.authentication.apiKeyHeader] = config.authentication.apiKey;
          }
          break;
        case 'basic':
          if (config.authentication.username && config.authentication.password) {
            const credentials = btoa(`${config.authentication.username}:${config.authentication.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
      }
    }

    // Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

    try {
      const response = await fetch(config.endpoint, {
        method: config.method,
        headers,
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Sin detalles');
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json().catch(() => ({ status: 'success' }));
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado al conectar con la API');
      }
      throw error;
    }
  }
}

