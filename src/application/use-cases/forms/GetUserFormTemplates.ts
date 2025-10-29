import { IFormTemplateRepository } from '../../../domain/repositories/IFormTemplateRepository';
import { FormTemplate } from '../../../domain/entities/FormTemplate';

export class GetUserFormTemplates {
  constructor(private formTemplateRepository: IFormTemplateRepository) {}

  async execute(userId: string): Promise<FormTemplate[]> {
    return await this.formTemplateRepository.findByUserId(userId);
  }
}

