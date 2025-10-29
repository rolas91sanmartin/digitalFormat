import Database from 'better-sqlite3';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User, CreateUserDTO } from '../../domain/entities/User';
import { randomUUID } from 'crypto';

export class SQLiteUserRepository implements IUserRepository {
  constructor(private db: Database.Database) {}

  async create(userData: CreateUserDTO): Promise<User> {
    const id = randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO users (id, username, email, passwordHash, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, userData.username, userData.email, userData.password, now, now);

    return {
      id,
      username: userData.username,
      email: userData.email,
      passwordHash: userData.password,
      createdAt: new Date(now),
      updatedAt: new Date(now)
    };
  }

  async findById(id: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row: any = stmt.get(id);

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
    const row: any = stmt.get(email);

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async findByUsername(username: string): Promise<User | null> {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
    const row: any = stmt.get(username);

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.passwordHash,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
  }

  async update(id: string, userData: Partial<User>): Promise<User> {
    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.username) {
      updates.push('username = ?');
      values.push(userData.username);
    }
    if (userData.email) {
      updates.push('email = ?');
      values.push(userData.email);
    }
    if (userData.passwordHash) {
      updates.push('passwordHash = ?');
      values.push(userData.passwordHash);
    }

    updates.push('updatedAt = ?');
    values.push(now, id);

    const stmt = this.db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);

    const user = await this.findById(id);
    if (!user) throw new Error('Usuario no encontrado después de actualizar');
    return user;
  }

  async delete(id: string): Promise<void> {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }
}

