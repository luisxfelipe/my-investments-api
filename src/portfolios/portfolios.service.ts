import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Portfolio } from './entities/portfolio.entity';
import { SavingsGoalsService } from 'src/savings-goals/savings-goals.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { AssetsService } from 'src/assets/assets.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly repository: Repository<Portfolio>,
    private readonly usersService: UsersService,
    private readonly assetsService: AssetsService,
    private readonly platformsService: PlatformsService,
    private readonly savingsGoalsService: SavingsGoalsService,
  ) { }

  async create(createPortfolioDto: CreatePortfolioDto): Promise<Portfolio> {
    // Verifica se o usuário existe
    await this.usersService.findOne(createPortfolioDto.userId);

    // Verifica se o ativo existe
    await this.assetsService.findOne(createPortfolioDto.assetId);

    // Verifica se a plataforma existe
    await this.platformsService.findOne(createPortfolioDto.platformId);

    // Verifica se a caixinha/objetivo existe, se foi fornecida
    if (createPortfolioDto.savingsGoalId) {
      await this.savingsGoalsService.findOne(createPortfolioDto.savingsGoalId);
    }

    // Verifica se já existe um portfolio para este usuário, ativo e plataforma
    const existingPortfolio = await this.repository.findOne({
      where: {
        userId: createPortfolioDto.userId,
        assetId: createPortfolioDto.assetId,
        platformId: createPortfolioDto.platformId,
      }
    });

    if (existingPortfolio) {
      throw new BadRequestException(`Portfolio already exists for this user, asset and platform`);
    }

    const portfolio = this.repository.create(createPortfolioDto);
    return this.repository.save(portfolio);
  }

  async findAll(): Promise<Portfolio[]> {
    return this.repository.find({
      relations: ['user', 'asset', 'platform', 'savingsGoal'],
    });
  }

  async findOne(id: number): Promise<Portfolio> {
    const portfolio = await this.repository.findOne({
      where: { id },
      relations: ['user', 'asset', 'platform', 'savingsGoal'],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }

    return portfolio;
  }

  async update(id: number, updatePortfolioDto: UpdatePortfolioDto): Promise<Portfolio> {
    if (!updatePortfolioDto || Object.keys(updatePortfolioDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se o portfolio existe
    const portfolio = await this.findOne(id);

    // Verifica se o usuário existe, se foi fornecido
    if (updatePortfolioDto.userId) {
      await this.usersService.findOne(updatePortfolioDto.userId);
    }

    // Verifica se o ativo existe, se foi fornecido
    if (updatePortfolioDto.assetId) {
      await this.assetsService.findOne(updatePortfolioDto.assetId);
    }

    // Verifica se a plataforma existe, se foi fornecida
    if (updatePortfolioDto.platformId) {
      await this.platformsService.findOne(updatePortfolioDto.platformId);
    }

    // Verifica se a caixinha/objetivo existe, se foi fornecida
    if (updatePortfolioDto.savingsGoalId) {
      await this.savingsGoalsService.findOne(updatePortfolioDto.savingsGoalId);
    }

    // Se estiver alterando usuário, ativo ou plataforma, verifica se já existe outro portfolio com essa combinação
    if (updatePortfolioDto.userId || updatePortfolioDto.assetId || updatePortfolioDto.platformId) {
      const userId = updatePortfolioDto.userId || portfolio.userId;
      const assetId = updatePortfolioDto.assetId || portfolio.assetId;
      const platformId = updatePortfolioDto.platformId || portfolio.platformId;

      const existingPortfolio = await this.repository.findOne({
        where: {
          userId,
          assetId,
          platformId,
        }
      });

      if (existingPortfolio && existingPortfolio.id !== id) {
        throw new BadRequestException(`Portfolio already exists for this user, asset and platform`);
      }
    }

    this.repository.merge(portfolio, updatePortfolioDto);
    return this.repository.save(portfolio);
  }

  async remove(id: number): Promise<void> {
    // Verifica se o portfolio existe
    await this.findOne(id);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }
}
