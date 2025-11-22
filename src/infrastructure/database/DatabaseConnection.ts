import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';

export class DatabaseConnection {
  private static instance: Database.Database;

  static getInstance(): Database.Database {
    if (!this.instance) {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'formatprinter.db');
      
      this.instance = new Database(dbPath);
      this.instance.pragma('journal_mode = WAL');
      
      this.initializeTables();
    }
    return this.instance;
  }

  private static initializeTables(): void {
    const db = this.instance;

    // Tabla de usuarios
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        passwordHash TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      )
    `);

    // Tabla de códigos de recuperación de contraseña
    db.exec(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        code TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabla de plantillas de formularios
    db.exec(`
      CREATE TABLE IF NOT EXISTS form_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        userId TEXT NOT NULL,
        backgroundImage TEXT NOT NULL,
        staticElements TEXT NOT NULL DEFAULT '[]',
        fields TEXT NOT NULL DEFAULT '[]',
        tables TEXT NOT NULL DEFAULT '[]',
        renderMode TEXT NOT NULL DEFAULT 'hybrid',
        pageWidth INTEGER NOT NULL,
        pageHeight INTEGER NOT NULL,
        apiConfiguration TEXT,
        numerationConfig TEXT,
        fieldMappings TEXT,
        tableMappings TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tabla de secuencias de numeración
    db.exec(`
      CREATE TABLE IF NOT EXISTS form_sequences (
        templateId TEXT PRIMARY KEY,
        lastNumber INTEGER NOT NULL DEFAULT 0,
        lastUsed TEXT NOT NULL,
        FOREIGN KEY (templateId) REFERENCES form_templates(id) ON DELETE CASCADE
      )
    `);

    // Tabla de formularios enviados
    db.exec(`
      CREATE TABLE IF NOT EXISTS submitted_forms (
        id TEXT PRIMARY KEY,
        templateId TEXT NOT NULL,
        submittedBy TEXT NOT NULL,
        formNumber TEXT,
        fieldValues TEXT NOT NULL,
        apiResponse TEXT,
        apiStatus TEXT CHECK(apiStatus IN ('pending', 'success', 'error')),
        apiError TEXT,
        submittedAt TEXT NOT NULL,
        FOREIGN KEY (templateId) REFERENCES form_templates(id) ON DELETE CASCADE,
        FOREIGN KEY (submittedBy) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Crear índices
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_form_templates_userId ON form_templates(userId)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_password_reset_codes_userId ON password_reset_codes(userId)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_submitted_forms_templateId ON submitted_forms(templateId)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_submitted_forms_submittedBy ON submitted_forms(submittedBy)
    `);

    // Migración: Agregar columnas nuevas si no existen
    this.runMigrations();
  }

  private static runMigrations(): void {
    const db = this.instance;

    try {
      // Verificar si existen las columnas nuevas y agregarlas si no
      const tableInfo = db.pragma('table_info(form_templates)') as Array<{ name: string }>;
      const columnNames = tableInfo.map((col) => col.name);

      if (!columnNames.includes('staticElements')) {
        console.log('Migrando: Agregando columna staticElements...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN staticElements TEXT NOT NULL DEFAULT '[]'`);
      }

      if (!columnNames.includes('fields')) {
        console.log('Migrando: Agregando columna fields...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN fields TEXT NOT NULL DEFAULT '[]'`);
      }

      if (!columnNames.includes('tables')) {
        console.log('Migrando: Agregando columna tables...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN tables TEXT NOT NULL DEFAULT '[]'`);
      }

      if (!columnNames.includes('renderMode')) {
        console.log('Migrando: Agregando columna renderMode...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN renderMode TEXT NOT NULL DEFAULT 'hybrid'`);
      }

      if (!columnNames.includes('pageWidth')) {
        console.log('Migrando: Agregando columna pageWidth...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN pageWidth INTEGER NOT NULL DEFAULT 816`);
      }

      if (!columnNames.includes('pageHeight')) {
        console.log('Migrando: Agregando columna pageHeight...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN pageHeight INTEGER NOT NULL DEFAULT 1056`);
      }

      if (!columnNames.includes('apiConfiguration')) {
        console.log('Migrando: Agregando columna apiConfiguration...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN apiConfiguration TEXT`);
      }

      if (!columnNames.includes('numerationConfig')) {
        console.log('Migrando: Agregando columna numerationConfig...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN numerationConfig TEXT`);
      }

      if (!columnNames.includes('fieldMappings')) {
        console.log('Migrando: Agregando columna fieldMappings...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN fieldMappings TEXT`);
      }

      if (!columnNames.includes('tableMappings')) {
        console.log('Migrando: Agregando columna tableMappings...');
        db.exec(`ALTER TABLE form_templates ADD COLUMN tableMappings TEXT`);
      }

      console.log('✅ Migraciones completadas exitosamente');
    } catch (error) {
      console.error('Error durante las migraciones:', error);
      throw error;
    }
  }

  static close(): void {
    if (this.instance) {
      this.instance.close();
    }
  }
}

