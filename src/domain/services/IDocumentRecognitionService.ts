import { FormField, StaticElement, TableDefinition } from '../entities/FormTemplate';

export interface DocumentAnalysisResult {
  staticElements: StaticElement[];
  fields: FormField[];
  tables: TableDefinition[];
  pageSize: {
    width: number;
    height: number;
  };
  backgroundImage: string;
}

export interface IDocumentRecognitionService {
  analyzeDocument(fileBuffer: Buffer, fileType: 'pdf' | 'image'): Promise<DocumentAnalysisResult>;
}

