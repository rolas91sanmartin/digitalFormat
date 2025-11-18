import Database from 'better-sqlite3';
import { IFormTemplateRepository } from '../../domain/repositories/IFormTemplateRepository';
import { FormTemplate } from '../../domain/entities/FormTemplate';
import { randomUUID } from 'crypto';

export class SQLiteFormTemplateRepository implements IFormTemplateRepository {
  constructor(private db: Database.Database) {}

  async create(templateData: Omit<FormTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<FormTemplate> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO form_templates (
        id, name, description, userId, backgroundImage, 
        staticElements, fields, tables, renderMode,
        pageWidth, pageHeight, apiConfiguration, numerationConfig, fieldMappings, tableMappings,
        createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      templateData.name,
      templateData.description || null,
      templateData.userId,
      templateData.backgroundImage,
      JSON.stringify(templateData.staticElements || []),
      JSON.stringify(templateData.fields || []),
      JSON.stringify(templateData.tables || []),
      templateData.renderMode || 'hybrid',
      templateData.pageSize.width,
      templateData.pageSize.height,
      templateData.apiConfiguration ? JSON.stringify(templateData.apiConfiguration) : null,
      templateData.numerationConfig ? JSON.stringify(templateData.numerationConfig) : null,
      templateData.fieldMappings ? JSON.stringify(templateData.fieldMappings) : null,
      templateData.tableMappings ? JSON.stringify(templateData.tableMappings) : null,
      now,
      now
    );

    return {
      id,
      ...templateData,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async findById(id: string): Promise<FormTemplate | null> {
    const stmt = this.db.prepare('SELECT * FROM form_templates WHERE id = ?');
    const row: any = stmt.get(id);

    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      userId: row.userId,
      backgroundImage: row.backgroundImage,
      staticElements: JSON.parse(row.staticElements || '[]'),
      fields: JSON.parse(row.fields || '[]'),
      tables: JSON.parse(row.tables || '[]'),
      renderMode: row.renderMode || 'hybrid',
      pageSize: {
        width: row.pageWidth,
        height: row.pageHeight
      },
      apiConfiguration: row.apiConfiguration ? JSON.parse(row.apiConfiguration) : undefined,
      numerationConfig: row.numerationConfig ? JSON.parse(row.numerationConfig) : undefined,
      fieldMappings: row.fieldMappings ? JSON.parse(row.fieldMappings) : undefined,
      tableMappings: row.tableMappings ? JSON.parse(row.tableMappings) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async findByUserId(userId: string): Promise<FormTemplate[]> {
    const stmt = this.db.prepare('SELECT * FROM form_templates WHERE userId = ? ORDER BY createdAt DESC');
    const rows: any[] = stmt.all(userId);

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      userId: row.userId,
      backgroundImage: row.backgroundImage,
      staticElements: JSON.parse(row.staticElements || '[]'),
      fields: JSON.parse(row.fields || '[]'),
      tables: JSON.parse(row.tables || '[]'),
      renderMode: row.renderMode || 'hybrid',
      pageSize: {
        width: row.pageWidth,
        height: row.pageHeight
      },
      apiConfiguration: row.apiConfiguration ? JSON.parse(row.apiConfiguration) : undefined,
      numerationConfig: row.numerationConfig ? JSON.parse(row.numerationConfig) : undefined,
      fieldMappings: row.fieldMappings ? JSON.parse(row.fieldMappings) : undefined,
      tableMappings: row.tableMappings ? JSON.parse(row.tableMappings) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
  }

  async update(id: string, templateData: Partial<FormTemplate>): Promise<FormTemplate> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (templateData.name) {
      updates.push('name = ?');
      values.push(templateData.name);
    }
    if (templateData.description !== undefined) {
      updates.push('description = ?');
      values.push(templateData.description);
    }
    if (templateData.staticElements !== undefined) {
      updates.push('staticElements = ?');
      values.push(JSON.stringify(templateData.staticElements));
    }
    if (templateData.fields !== undefined) {
      updates.push('fields = ?');
      values.push(JSON.stringify(templateData.fields));
    }
    if (templateData.tables !== undefined) {
      updates.push('tables = ?');
      values.push(JSON.stringify(templateData.tables));
    }
    if (templateData.renderMode) {
      updates.push('renderMode = ?');
      values.push(templateData.renderMode);
    }
    if (templateData.pageSize) {
      updates.push('pageWidth = ?');
      updates.push('pageHeight = ?');
      values.push(templateData.pageSize.width);
      values.push(templateData.pageSize.height);
    }
    if (templateData.apiConfiguration !== undefined) {
      updates.push('apiConfiguration = ?');
      values.push(templateData.apiConfiguration ? JSON.stringify(templateData.apiConfiguration) : null);
    }
    if (templateData.numerationConfig !== undefined) {
      updates.push('numerationConfig = ?');
      values.push(templateData.numerationConfig ? JSON.stringify(templateData.numerationConfig) : null);
    }
    if (templateData.fieldMappings !== undefined) {
      updates.push('fieldMappings = ?');
      values.push(templateData.fieldMappings ? JSON.stringify(templateData.fieldMappings) : null);
    }

    updates.push('updatedAt = ?');
    values.push(now, id);

    const stmt = this.db.prepare(`
      UPDATE form_templates SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    const template = await this.findById(id);
    if (!template) throw new Error('Plantilla no encontrada después de actualizar');
    return template;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM form_templates WHERE id = ?');
    stmt.run(id);
  }
}

