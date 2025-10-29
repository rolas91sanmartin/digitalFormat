import { IFormTemplateRepository } from '../../../domain/repositories/IFormTemplateRepository';

export class DeleteFormTemplate {
  constructor(private formTemplateRepository: IFormTemplateRepository) {}

  async execute(id: string, userId: string): Promise<void> {
    // Verificar que la plantilla pertenece al usuario
    const template = await this.formTemplateRepository.findById(id);
    if (!template) {
      throw new Error('Plantilla no encontrada');
    }

    if (template.userId !== userId) {
      throw new Error('No tienes permiso para eliminar esta plantilla');
    }

    await this.formTemplateRepository.delete(id);
  }
}

