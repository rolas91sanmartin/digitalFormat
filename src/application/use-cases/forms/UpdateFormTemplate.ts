import { IFormTemplateRepository } from '../../../domain/repositories/IFormTemplateRepository';
import { FormTemplate } from '../../../domain/entities/FormTemplate';

export class UpdateFormTemplate {
  constructor(private formTemplateRepository: IFormTemplateRepository) {}

  async execute(id: string, userId: string, updates: Partial<FormTemplate>): Promise<FormTemplate> {
    // Verificar que la plantilla existe y pertenece al usuario
    const template = await this.formTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Plantilla no encontrada');
    }

    if (template.userId !== userId) {
      throw new Error('No tienes permiso para editar esta plantilla');
    }

    // Actualizar la plantilla
    const updatedTemplate = await this.formTemplateRepository.update(id, updates);
    
    return updatedTemplate;
  }
}

