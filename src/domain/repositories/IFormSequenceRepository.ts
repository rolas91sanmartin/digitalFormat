import { FormSequence } from '../entities/FormTemplate';

export interface IFormSequenceRepository {
  findByTemplateId(templateId: string): Promise<FormSequence | null>;
  create(sequence: { templateId: string; lastNumber: number }): Promise<FormSequence>;
  update(templateId: string, lastNumber: number): Promise<FormSequence>;
  delete(templateId: string): Promise<void>;
}

