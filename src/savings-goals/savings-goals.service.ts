import { PaginatedResponseDto } from '../dtos/paginated-response.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { SavingGoal } from './entities/saving-goal.entity';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { PortfoliosService } from 'src/portfolios/portfolios.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateSavingGoalDto } from './dto/create-saving-goal.dto';
import { UpdateSavingGoalDto } from './dto/update-saving-goal.dto';

@Injectable()
export class SavingsGoalsService {
  constructor(
    @InjectRepository(SavingGoal)
    private readonly repository: Repository<SavingGoal>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => PortfoliosService))
    private readonly portfoliosService: PortfoliosService,
  ) {}

  async create(
    createSavingGoalDto: CreateSavingGoalDto,
    userId: number,
  ): Promise<SavingGoal> {
    // Verifica se o usuário existe
    await this.usersService.findOne(userId);

    // Substitui o userId com o obtido do token (mais seguro)
    const savingGoal = this.repository.create({
      ...createSavingGoalDto,
      userId: userId,
    });
    return this.repository.save(savingGoal);
  }

  async findAll(userId: number): Promise<SavingGoal[]> {
    return this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
    userId: number,
  ): Promise<PaginatedResponseDto<SavingGoal>> {
    const skip = (page - 1) * take;

    const [savingGoals, total] = await this.repository.findAndCount({
      where: { userId },
      take,
      skip,
      order: { name: 'ASC' },
    });

    return new PaginatedResponseDto(savingGoals, total, take, page);
  }

  async findOne(id: number, userId: number): Promise<SavingGoal> {
    const savingsGoal = await this.repository.findOne({
      where: { id, userId },
    });

    if (!savingsGoal) {
      throw new NotFoundException(
        `Savings Goal with ID ${id} not found or access denied`,
      );
    }

    return savingsGoal;
  }

  // Método para compatibilidade com outros serviços que só precisam verificar se o goal existe
  async findOneById(id: number): Promise<SavingGoal> {
    const savingsGoal = await this.repository.findOne({
      where: { id },
    });

    if (!savingsGoal) {
      throw new NotFoundException(`Savings Goal with ID ${id} not found`);
    }

    return savingsGoal;
  }

  async update(
    id: number,
    updateSavingGoalDto: UpdateSavingGoalDto,
    userId: number,
  ): Promise<SavingGoal> {
    if (!updateSavingGoalDto || Object.keys(updateSavingGoalDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se a meta de economia existe e pertence ao usuário
    const savingsGoal = await this.findOne(id, userId);

    // Como removemos userId do UpdateSavingGoalDto, não precisamos filtrá-lo mais
    this.repository.merge(savingsGoal, updateSavingGoalDto);
    return this.repository.save(savingsGoal);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se a meta de economia existe e pertence ao usuário
    await this.findOne(id, userId);

    // Verificar se existem portfolios usando este objetivo de poupança
    const portfoliosCount =
      await this.portfoliosService.countBySavingsGoalId(id);
    if (portfoliosCount > 0) {
      throw new BadRequestException(
        `Cannot delete savings goal with ID ${id}. It is being used by ${portfoliosCount} portfolio(s).`,
      );
    }

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete({ id, userId });
  }
}
