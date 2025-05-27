import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await this.hashPassword(createUserDto.password);
    const user = this.repository.create({
      ...createUserDto,
      password: hashedPassword,
    });
    return this.repository.save(user);
  }

  async findOne(id: number): Promise<User> {
    const user = await this.repository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findOneByEmail(email: string): Promise<User> {
    const user = await this.repository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }

    return user;
  }

  async updateProfile(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    // Verificar se updateUserDto existe e tem pelo menos uma propriedade
    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('No properties provided for update');
    }

    const user = await this.findOne(id);

    // Verificar se o email já existe (se estiver sendo alterado)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.repository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    this.repository.merge(user, updateUserDto);
    return this.repository.save(user);
  }

  async changePassword(
    id: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const user = await this.findOne(id);

    // Verificar se a senha atual está correta
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash da nova senha
    const hashedNewPassword = await this.hashPassword(
      changePasswordDto.newPassword,
    );

    // Atualizar a senha
    await this.repository.update(id, { password: hashedNewPassword });
  }

  // Método antigo mantido para compatibilidade com auth
  async update(id: number, updateUserDto: Partial<User>): Promise<User> {
    // Verificar se updateUserDto existe e tem pelo menos uma propriedade
    if (!updateUserDto || Object.keys(updateUserDto).length === 0) {
      throw new BadRequestException('No properties provided for update');
    }

    const user = await this.findOne(id);

    // Se a senha foi fornecida, vamos criptografá-la
    if (updateUserDto.password) {
      updateUserDto.password = await this.hashPassword(updateUserDto.password);
    }

    this.repository.merge(user, updateUserDto);
    return this.repository.save(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }
}
