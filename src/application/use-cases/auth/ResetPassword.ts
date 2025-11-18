import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import Database from 'better-sqlite3';
import * as bcrypt from 'bcrypt';

export interface ResetPasswordDTO {
  email: string;
  code: string;
  newPassword: string;
}

export class ResetPassword {
  constructor(
    private userRepository: IUserRepository,
    private db: Database.Database
  ) {}

  async execute(data: ResetPasswordDTO): Promise<void> {
    // Buscar usuario
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Verificar código
    const stmt = this.db.prepare(`
      SELECT * FROM password_reset_codes 
      WHERE userId = ? AND code = ? AND used = 0 AND expiresAt > datetime('now')
      ORDER BY createdAt DESC
      LIMIT 1
    `);

    const resetCode: any = stmt.get(user.id, data.code);

    if (!resetCode) {
      throw new Error('Código inválido o expirado');
    }

    // Hash de la nueva contraseña
    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    // Actualizar contraseña
    await this.userRepository.update(user.id, { passwordHash });

    // Marcar código como usado
    const updateStmt = this.db.prepare(`
      UPDATE password_reset_codes 
      SET used = 1 
      WHERE id = ?
    `);
    updateStmt.run(resetCode.id);
  }
}

