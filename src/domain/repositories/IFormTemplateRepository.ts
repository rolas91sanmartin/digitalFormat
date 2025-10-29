import { FormTemplate } from '../entities/FormTemplate';

export interface IFormTemplateRepository {
  create(template: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<FormTemplate>;
  findById(id: string): Promise<FormTemplate | null>;
  findByUserId(userId: string): Promise<FormTemplate[]>;
  update(id: string, template: Partial<FormTemplate>): Promise<FormTemplate>;
  delete(id: string): Promise<void>;
}

