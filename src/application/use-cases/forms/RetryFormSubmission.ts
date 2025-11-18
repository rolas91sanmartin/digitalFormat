import { IFormTemplateRepository } from '../../../domain/repositories/IFormTemplateRepository';
import { ISubmittedFormRepository } from '../../../domain/repositories/ISubmittedFormRepository';
import { ApiConfiguration, FieldMapping } from '../../../domain/entities/FormTemplate';

export class RetryFormSubmission {
  constructor(
    private formTemplateRepository: IFormTemplateRepository,
    private submittedFormRepository: ISubmittedFormRepository
  ) {}

  async execute(submittedFormId: string): Promise<{ success: boolean; error?: string; apiResponse?: any }> {
    try {
      // 1. Obtener formulario enviado
      const submittedForm = await this.submittedFormRepository.findById(submittedFormId);
      if (!submittedForm) {
        return { success: false, error: 'Formulario no encontrado' };
      }

      // 2. Verificar que tenga error
      if (submittedForm.apiStatus !== 'error') {
        return { success: false, error: 'El formulario no tiene error para reintentar' };
      }

      // 3. Obtener template
      const template = await this.formTemplateRepository.findById(submittedForm.templateId);
      if (!template || !template.apiConfiguration?.enabled) {
        return { success: false, error: 'La configuración de API no está disponible' };
      }

      // 4. Mapear datos
      const mappedData = this.mapFieldsToApi(template, submittedForm.fieldValues);

      // 5. Reintentar envío
      const apiResponse = await this.sendToApi(template.apiConfiguration, mappedData);

      // 6. Actualizar estado
      await this.submittedFormRepository.update(submittedFormId, {
        apiResponse,
        apiStatus: 'success',
        apiError: undefined
      });

      return { success: true, apiResponse };
    } catch (error: any) {
      // Actualizar error
      await this.submittedFormRepository.update(submittedFormId, {
        apiError: error.message
      });

      return { success: false, error: error.message };
    }
  }

  private mapFieldsToApi(template: any, values: Record<string, any>): any {
    const result: any = {};

    if (!template.fieldMappings || template.fieldMappings.length === 0) {
      return values;
    }

    template.fieldMappings.forEach((mapping: FieldMapping) => {
      let value = values[mapping.fieldId];

      if ((value === undefined || value === null || value === '') && mapping.defaultValue !== undefined) {
        value = mapping.defaultValue;
      }

      if (mapping.transform && value !== undefined && value !== null) {
        value = this.transformValue(value, mapping.transform);
      }

      result[mapping.apiKey] = value;
    });

    return result;
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

