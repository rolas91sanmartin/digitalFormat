import { SubmittedForm } from '../entities/FormTemplate';

export interface CreateSubmittedFormDTO {
  templateId: string;
  submittedBy: string;
  formNumber: string;
  fieldValues: Record<string, any>;
  apiStatus?: 'pending' | 'success' | 'error';
}

export interface ISubmittedFormRepository {
  create(data: CreateSubmittedFormDTO): Promise<SubmittedForm>;
  findById(id: string): Promise<SubmittedForm | null>;
  findByTemplateId(templateId: string): Promise<SubmittedForm[]>;
  findByUserId(userId: string): Promise<SubmittedForm[]>;
  update(id: string, data: Partial<SubmittedForm>): Promise<SubmittedForm>;
  delete(id: string): Promise<void>;
}

