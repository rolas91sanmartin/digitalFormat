import { IFormTemplateRepository } from '../../../domain/repositories/IFormTemplateRepository';
import { IDocumentRecognitionService } from '../../../domain/services/IDocumentRecognitionService';
import { CreateFormTemplateDTO, FormTemplate } from '../../../domain/entities/FormTemplate';

export class CreateFormTemplate {
  constructor(
    private formTemplateRepository: IFormTemplateRepository,
    private documentRecognitionService: IDocumentRecognitionService
  ) {}

  async execute(data: CreateFormTemplateDTO): Promise<FormTemplate> {
    // Analizar el documento con IA
    const analysisResult = await this.documentRecognitionService.analyzeDocument(
      data.documentFile,
      data.documentType
    );

    // Crear la plantilla del formulario
    const template = await this.formTemplateRepository.create({
      name: data.name,
      description: data.description,
      userId: data.userId,
      backgroundImage: analysisResult.backgroundImage,
      staticElements: analysisResult.staticElements || [],
      fields: analysisResult.fields || [],
      tables: analysisResult.tables || [],
      renderMode: 'hybrid',
      pageSize: analysisResult.pageSize
    });

    return template;
  }
}

