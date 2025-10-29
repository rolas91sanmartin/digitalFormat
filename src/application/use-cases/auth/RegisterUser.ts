import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { CreateUserDTO, User } from '../../../domain/entities/User';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

export class RegisterUser {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: CreateUserDTO): Promise<User> {
    // Validar que el email no exista
    const existingEmail = await this.userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('El email ya está registrado');
    }

    // Validar que el username no exista
    const existingUsername = await this.userRepository.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('El nombre de usuario ya está en uso');
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Crear usuario
    const user = await this.userRepository.create({
      ...data,
      password: passwordHash
    });

    return user;
  }
}

