import { IFormTemplateRepository } from '../../../domain/repositories/IFormTemplateRepository';
import { FormTemplate } from '../../../domain/entities/FormTemplate';

export class GetFormTemplateById {
  constructor(private formTemplateRepository: IFormTemplateRepository) {}

  async execute(id: string): Promise<FormTemplate> {
    const template = await this.formTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Plantilla no encontrada');
    }
    return template;
  }
}

