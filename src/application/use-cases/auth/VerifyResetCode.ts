import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import Database from 'better-sqlite3';

export interface VerifyResetCodeDTO {
  email: string;
  code: string;
}

export class VerifyResetCode {
  constructor(
    private userRepository: IUserRepository,
    private db: Database.Database
  ) {}

  async execute(data: VerifyResetCodeDTO): Promise<boolean> {
    // Buscar usuario
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      return false;
    }

    // Buscar código válido
    const stmt = this.db.prepare(`
      SELECT * FROM password_reset_codes 
      WHERE userId = ? AND code = ? AND used = 0 AND expiresAt > datetime('now')
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    const resetCode: any = stmt.get(user.id, data.code);

    return !!resetCode;
  }
}

