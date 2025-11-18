import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { ISubmittedFormRepository, CreateSubmittedFormDTO } from '../../domain/repositories/ISubmittedFormRepository';
import { SubmittedForm } from '../../domain/entities/FormTemplate';

export class SQLiteSubmittedFormRepository implements ISubmittedFormRepository {
  constructor(private db: Database.Database) {}

  async create(data: CreateSubmittedFormDTO): Promise<SubmittedForm> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO submitted_forms (
        id, templateId, submittedBy, formNumber, fieldValues, 
        apiStatus, submittedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.templateId,
      data.submittedBy,
      data.formNumber,
      JSON.stringify(data.fieldValues),
      data.apiStatus || null,
      now
    );

    return {
      id,
      templateId: data.templateId,
      submittedBy: data.submittedBy,
      formNumber: data.formNumber,
      fieldValues: data.fieldValues,
      apiStatus: data.apiStatus,
      submittedAt: new Date(now)
    };
  }

  async findById(id: string): Promise<SubmittedForm | null> {
    const stmt = this.db.prepare('SELECT * FROM submitted_forms WHERE id = ?');
    const row: any = stmt.get(id);

    if (!row) return null;

    return this.mapRowToEntity(row);
  }

  async findByTemplateId(templateId: string): Promise<SubmittedForm[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM submitted_forms 
      WHERE templateId = ? 
      ORDER BY submittedAt DESC
    `);
    const rows: any[] = stmt.all(templateId);

    return rows.map(row => this.mapRowToEntity(row));
  }

  async findByUserId(userId: string): Promise<SubmittedForm[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM submitted_forms 
      WHERE submittedBy = ? 
      ORDER BY submittedAt DESC
    `);
    const rows: any[] = stmt.all(userId);

    return rows.map(row => this.mapRowToEntity(row));
  }

  async update(id: string, data: Partial<SubmittedForm>): Promise<SubmittedForm> {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.apiResponse !== undefined) {
      updates.push('apiResponse = ?');
      values.push(JSON.stringify(data.apiResponse));
    }

    if (data.apiStatus !== undefined) {
      updates.push('apiStatus = ?');
      values.push(data.apiStatus);
    }

    if (data.apiError !== undefined) {
      updates.push('apiError = ?');
      values.push(data.apiError);
    }

    if (updates.length === 0) {
      const form = await this.findById(id);
      if (!form) throw new Error('Formulario no encontrado');
      return form;
    }

    values.push(id);

    const stmt = this.db.prepare(`
      UPDATE submitted_forms SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    const form = await this.findById(id);
    if (!form) throw new Error('Formulario no encontrado después de actualizar');
    return form;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM submitted_forms WHERE id = ?');
    stmt.run(id);
  }

  private mapRowToEntity(row: any): SubmittedForm {
    return {
      id: row.id,
      templateId: row.templateId,
      submittedBy: row.submittedBy,
      formNumber: row.formNumber,
      fieldValues: JSON.parse(row.fieldValues),
      apiResponse: row.apiResponse ? JSON.parse(row.apiResponse) : undefined,
      apiStatus: row.apiStatus,
      apiError: row.apiError,
      submittedAt: new Date(row.submittedAt)
    };
  }
}

