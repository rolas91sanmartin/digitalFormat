import Database from 'better-sqlite3';
import { IFormSequenceRepository } from '../../domain/repositories/IFormSequenceRepository';
import { FormSequence } from '../../domain/entities/FormTemplate';

export class SQLiteFormSequenceRepository implements IFormSequenceRepository {
  constructor(private db: Database.Database) {}

  async findByTemplateId(templateId: string): Promise<FormSequence | null> {
    const stmt = this.db.prepare('SELECT * FROM form_sequences WHERE templateId = ?');
    const row: any = stmt.get(templateId);

    if (!row) return null;

    return {
      templateId: row.templateId,
      lastNumber: row.lastNumber,
      lastUsed: new Date(row.lastUsed)
    };
  }

  async create(sequence: { templateId: string; lastNumber: number }): Promise<FormSequence> {
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO form_sequences (templateId, lastNumber, lastUsed)
      VALUES (?, ?, ?)
    `);

    stmt.run(sequence.templateId, sequence.lastNumber, now);

    return {
      templateId: sequence.templateId,
      lastNumber: sequence.lastNumber,
      lastUsed: new Date(now)
    };
  }

  async update(templateId: string, lastNumber: number): Promise<FormSequence> {
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE form_sequences 
      SET lastNumber = ?, lastUsed = ? 
      WHERE templateId = ?
    `);

    stmt.run(lastNumber, now, templateId);

    const sequence = await this.findByTemplateId(templateId);
    if (!sequence) throw new Error('Secuencia no encontrada después de actualizar');
    return sequence;
  }

  async delete(templateId: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM form_sequences WHERE templateId = ?');
    stmt.run(templateId);
  }
}

