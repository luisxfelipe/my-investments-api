import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SavingGoal } from './entities/saving-goal.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(
    @InjectRepository(SavingGoal)
    private readonly repository: Repository<SavingGoal>,
    private readonly usersService: UsersService,
  ) { }

  async create(createSavingGoalDto: CreateSavingGoalDto): Promise<SavingGoal> {
    // Verifica se o usuário existe
    await this.usersService.findOne(createSavingGoalDto.userId);

    const savingGoal = this.repository.create(createSavingGoalDto);
    return this.repository.save(savingGoal);
  }

  async findAll(): Promise<SavingGoal[]> {
    return this.repository.find({
      relations: ['user'],
    });
  }

  async findOne(id: number): Promise<SavingGoal> {
    const savingsGoal = await this.repository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!savingsGoal) {
      throw new NotFoundException(`Savings Goal with ID ${id} not found`);
    }

    return savingsGoal;
  }

  async update(id: number, updateSavingGoalDto: UpdateSavingGoalDto): Promise<SavingGoal> {
    if (!updateSavingGoalDto || Object.keys(updateSavingGoalDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se a meta de economia existe
    const savingsGoal = await this.findOne(id);

    // Verifica se o usuário existe, se foi fornecido
    if (updateSavingGoalDto.userId) {
      await this.usersService.findOne(updateSavingGoalDto.userId);
    }

    this.repository.merge(savingsGoal, updateSavingGoalDto);
    return this.repository.save(savingsGoal);
  }

  async remove(id: number): Promise<void> {
    // Verifica se a meta de economia existe
    await this.findOne(id);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }
}
