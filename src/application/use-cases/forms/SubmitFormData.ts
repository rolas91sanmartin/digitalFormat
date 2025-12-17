import { IFormTemplateRepository } from '../../../domain/repositories/IFormTemplateRepository';
import { IFormSequenceRepository } from '../../../domain/repositories/IFormSequenceRepository';
import { ISubmittedFormRepository } from '../../../domain/repositories/ISubmittedFormRepository';
import { FormTemplate, ApiConfiguration, FieldMapping } from '../../../domain/entities/FormTemplate';

export interface SubmitFormDataDTO {
  templateId: string;
  userId: string;
  userEmail: string;
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

      // 2. Generar número de folio (si está habilitado y NO es api-response)
      // ⭐ Si es api-response, el folio se extrae de la respuesta de la API después
      let formNumber = '';
      if (template.numerationConfig?.enabled && template.numerationConfig.source !== 'api-response') {
        try {
          formNumber = await this.generateFormNumber(template);
          // Agregar el número al campo correspondiente
          if (template.numerationConfig.fieldId) {
            data.values[template.numerationConfig.fieldId] = formNumber;
          }
          console.log('✅ [SubmitFormData] Folio generado:', formNumber);
        } catch (error: any) {
          return { success: false, error: `Error generando número: ${error.message}` };
        }
      } else if (template.numerationConfig?.enabled && template.numerationConfig.source === 'api-response') {
        console.log('📡 [SubmitFormData] Modo API Response: El folio se extraerá de la respuesta');
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
      console.log('🔍 [SubmitFormData] Verificando configuración de API...');
      console.log('🔍 [SubmitFormData] apiConfiguration:', template.apiConfiguration);
      console.log('🔍 [SubmitFormData] API habilitada?:', template.apiConfiguration?.enabled);
      
      if (template.apiConfiguration?.enabled) {
        console.log('✅ [SubmitFormData] API HABILITADA - Preparando envío...');
        try {
          // Mapear campos según configuración
          console.log('📋 [SubmitFormData] Datos originales:', data.values);
          console.log('👤 [SubmitFormData] Usuario que envía (ID):', data.userId);
          console.log('📧 [SubmitFormData] Email del usuario:', data.userEmail);
          const mappedData = this.mapFieldsToApi(template, data.values, data.userEmail, data.userId);
          console.log('📋 [SubmitFormData] Datos mapeados:', mappedData);
          console.log('🌐 [SubmitFormData] Endpoint:', template.apiConfiguration.endpoint);

          // Enviar a API
          console.log('🚀 [SubmitFormData] Enviando a API...');
          const apiResponse = await this.sendToApi(template.apiConfiguration, mappedData, data.userId, data.userEmail);
          console.log('✅ [SubmitFormData] Respuesta de API:', apiResponse);

          // ⭐ NUEVO: Extraer folio de la respuesta si es modo api-response
          console.log('🔍 [SubmitFormData] Verificando extracción de folio...');
          console.log('🔍 [SubmitFormData] Numeración habilitada?:', template.numerationConfig?.enabled);
          console.log('🔍 [SubmitFormData] Source:', template.numerationConfig?.source);
          console.log('🔍 [SubmitFormData] apiResponse existe?:', !!apiResponse);
          
          if (template.numerationConfig?.enabled && 
              template.numerationConfig.source === 'api-response' &&
              apiResponse) {
            console.log('🌐 [SubmitFormData] EXTRAYENDO FOLIO DE RESPUESTA DE API...');
            console.log('🌐 [SubmitFormData] Path configurado:', template.numerationConfig.apiResponseFolioPath);
            console.log('🌐 [SubmitFormData] Respuesta completa:', JSON.stringify(apiResponse, null, 2));
            
            try {
              const extractedFolio = this.extractFolioFromResponse(
                apiResponse, 
                template.numerationConfig.apiResponseFolioPath || ''
              );
              
              console.log('🔍 [SubmitFormData] Resultado de extracción:', extractedFolio);
              
              if (extractedFolio) {
                formNumber = extractedFolio;
                console.log('✅✅✅ [SubmitFormData] FOLIO EXTRAÍDO EXITOSAMENTE:', formNumber);
              } else {
                console.error('❌ [SubmitFormData] extractFolioFromResponse retornó null/undefined');
                console.error('❌ [SubmitFormData] Respuesta:', apiResponse);
                console.error('❌ [SubmitFormData] Path:', template.numerationConfig.apiResponseFolioPath);
              }
            } catch (error: any) {
              console.error('❌❌❌ [SubmitFormData] ERROR extrayendo folio de respuesta:', error);
              console.error('❌ [SubmitFormData] Stack:', error.stack);
            }
          } else {
            console.log('⏭️ [SubmitFormData] NO es modo api-response o no hay respuesta, usando formNumber actual:', formNumber);
          }

          // Actualizar con respuesta exitosa
          await this.submittedFormRepository.update(submittedForm.id, {
            apiResponse,
            apiStatus: 'success',
            formNumber // ⭐ Actualizar con el folio (sea generado o extraído)
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
      } else {
        console.log('⚠️ [SubmitFormData] API NO HABILITADA - Solo guardando localmente');
      }

      // Sin API configurada, solo guardado local
      console.log('💾 [SubmitFormData] Guardado local completado');
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

  private mapFieldsToApi(template: FormTemplate, values: Record<string, any>, userEmail: string, userId: string): any {
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
          submittedBy: userEmail,
          submittedAt: new Date().toISOString()
        },
        fields: mappedFields,
        tables: mappedTables
      };
    } else if (dataFormat === 'flat') {
      // Formato plano: todo al mismo nivel
      const flatData: any = {
        folio: values[template.numerationConfig?.fieldId || ''] || '',
        enviado_por: userEmail,
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
          submittedBy: userEmail,
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

  private async sendToApi(config: ApiConfiguration, data: any, userId?: string, userEmail?: string): Promise<any> {
    // Reemplazar placeholders del usuario en el endpoint
    let endpoint = config.endpoint;
    if (userId) {
      endpoint = endpoint.replace(/\{Usuario ID\}/g, userId);
      endpoint = endpoint.replace(/\{Usuario Email\}/g, userEmail || '');
      endpoint = endpoint.replace(/\{Usuario Nombre\}/g, userEmail || ''); // Por ahora usar email como nombre
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers
    };
    
    // Reemplazar placeholders del usuario en los headers
    if (userId) {
      Object.keys(headers).forEach(key => {
        headers[key] = headers[key]
          .replace(/\{Usuario ID\}/g, userId)
          .replace(/\{Usuario Email\}/g, userEmail || '')
          .replace(/\{Usuario Nombre\}/g, userEmail || '');
      });
    }
    
    console.log('📋 [sendToApi] Headers personalizados configurados:', config.headers);
    console.log('📋 [sendToApi] Headers iniciales:', headers);

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
    
    console.log('📋 [sendToApi] Headers finales (con autenticación):', headers);

    // Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout || 30000);

    try {
      console.log('🌐 [sendToApi] Realizando fetch a:', endpoint);
      console.log('🌐 [sendToApi] Método:', config.method);
      console.log('🌐 [sendToApi] Body:', JSON.stringify(data, null, 2));
      
      const response = await fetch(endpoint, {
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

  // ⭐ NUEVO: Método para extraer el folio de la respuesta de la API
  private extractFolioFromResponse(response: any, path: string): string | null {
    if (!path || !response) {
      console.warn('⚠️ [extractFolioFromResponse] Path o response vacío');
      return null;
    }

    const pathParts = path.split('.');
    let value: any = response;

    for (const part of pathParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        console.warn(`⚠️ [extractFolioFromResponse] No se encontró el path "${path}" en la respuesta`);
        console.log('📋 [extractFolioFromResponse] Respuesta recibida:', JSON.stringify(response, null, 2));
        return null;
      }
    }

    console.log(`✅ [extractFolioFromResponse] Folio encontrado en path "${path}":`, value);
    return String(value);
  }
}

