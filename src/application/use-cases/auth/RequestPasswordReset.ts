import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';

export interface RequestPasswordResetDTO {
  email: string;
}

export interface PasswordResetResponse {
  code: string;
  email: string;
  username: string;
}

export class RequestPasswordReset {
  constructor(
    private userRepository: IUserRepository,
    private db: Database.Database
  ) {}

  async execute(data: RequestPasswordResetDTO): Promise<PasswordResetResponse> {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('No existe una cuenta con ese correo electrónico');
    }

    // Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const id = randomUUID();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

    // Eliminar códigos anteriores no usados del usuario
    const deleteStmt = this.db.prepare(`
      DELETE FROM password_reset_codes 
      WHERE userId = ? AND used = 0
    `);
    deleteStmt.run(user.id);

    // Guardar nuevo código
    const insertStmt = this.db.prepare(`
      INSERT INTO password_reset_codes (id, userId, code, expiresAt, used, createdAt)
      VALUES (?, ?, ?, ?, 0, ?)
    `);
    insertStmt.run(id, user.id, code, expiresAt, now);

    return {
      code,
      email: user.email,
      username: user.username
    };
  }
}

