import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateSavingsGoalDto } from './dto/create-savings-goal.dto';
import { UpdateSavingsGoalDto } from './dto/update-savings-goal.dto';
import { SavingsGoal } from './entities/savings-goal.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SavingsGoalsService {
  constructor(
    @InjectRepository(SavingsGoal)
    private readonly repository: Repository<SavingsGoal>,
    private readonly usersService: UsersService,
  ) { }

  async create(createSavingsGoalDto: CreateSavingsGoalDto): Promise<SavingsGoal> {
    // Verifica se o usuário existe
    await this.usersService.findOne(createSavingsGoalDto.userId);

    const savingsGoal = this.repository.create(createSavingsGoalDto);
    return this.repository.save(savingsGoal);
  }

  async findAll(): Promise<SavingsGoal[]> {
    return this.repository.find({
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<SavingsGoal> {
    const savingsGoal = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!savingsGoal) {
      throw new NotFoundException(`Savings Goal with ID ${id} not found`);
    }

    return savingsGoal;
  }

  async update(id: number, updateSavingsGoalDto: UpdateSavingsGoalDto): Promise<SavingsGoal> {
    if (!updateSavingsGoalDto || Object.keys(updateSavingsGoalDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se a meta de economia existe
    const savingsGoal = await this.findOne(id);

    // Verifica se o usuário existe, se foi fornecido
    if (updateSavingsGoalDto.userId) {
      await this.usersService.findOne(updateSavingsGoalDto.userId);
    }

    this.repository.merge(savingsGoal, updateSavingsGoalDto);
    return this.repository.save(savingsGoal);
  }

  async remove(id: number): Promise<void> {
    // Verifica se a meta de economia existe
    await this.findOne(id);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }
}
