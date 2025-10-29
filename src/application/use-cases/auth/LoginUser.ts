import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { LoginDTO, User } from '../../../domain/entities/User';
import * as bcrypt from 'bcrypt';

export class LoginUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: LoginDTO): Promise<User> {
    // Buscar usuario por email
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas');
    }

    return user;
  }
}

