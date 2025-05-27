import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { Portfolio } from './entities/portfolio.entity';
import { SavingsGoalsService } from 'src/savings-goals/savings-goals.service';
import { PlatformsService } from 'src/platforms/platforms.service';
import { AssetsService } from 'src/assets/assets.service';
import { UsersService } from 'src/users/users.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';

@Injectable()
export class PortfoliosService {
  constructor(
    @InjectRepository(Portfolio)
    private readonly repository: Repository<Portfolio>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => AssetsService))
    private readonly assetsService: AssetsService,
    @Inject(forwardRef(() => PlatformsService))
    private readonly platformsService: PlatformsService,
    @Inject(forwardRef(() => SavingsGoalsService))
    private readonly savingsGoalsService: SavingsGoalsService,
    @Inject(forwardRef(() => TransactionsService))
    private readonly transactionsService: TransactionsService,
  ) {}

  async create(
    createPortfolioDto: CreatePortfolioDto,
    userId: number,
  ): Promise<Portfolio> {
    // Verifica se o usuário existe
    await this.usersService.findOne(userId);

    // Verifica se o ativo existe
    await this.assetsService.findOne(createPortfolioDto.assetId, userId);

    // Verifica se a plataforma existe para este usuário
    await this.platformsService.findOne(createPortfolioDto.platformId, userId);

    // Verifica se a caixinha/objetivo existe e pertence ao usuário, se foi fornecida
    if (createPortfolioDto.savingsGoalId) {
      await this.savingsGoalsService.findOne(
        createPortfolioDto.savingsGoalId,
        userId,
      );
    }

    // Verifica se já existe um portfolio para este usuário, ativo e plataforma
    const existingPortfolio = await this.repository.findOne({
      where: {
        userId,
        assetId: createPortfolioDto.assetId,
        platformId: createPortfolioDto.platformId,
      },
    });

    if (existingPortfolio) {
      throw new BadRequestException(
        `Portfolio already exists for this user, asset and platform`,
      );
    }

    const portfolio = this.repository.create({
      ...createPortfolioDto,
      userId, // Usar o userId do usuário autenticado
      currentBalance: 0,
      averagePrice: 0,
    });
    const savedPortfolio = await this.repository.save(portfolio);

    // Recalcular balance e preço médio após criação
    return this.recalculatePortfolioBalance(savedPortfolio.id);
  }

  async findAll(userId: number): Promise<Portfolio[]> {
    return this.repository.find({
      where: { userId },
      relations: [
        'user',
        'asset',
        'asset.category',
        'asset.assetType',
        'platform',
        'savingsGoal',
      ],
    });
  }

  async findOne(id: number, userId?: number): Promise<Portfolio> {
    const whereClause: { id: number; userId?: number } = { id };
    if (userId) {
      whereClause.userId = userId;
    }

    const portfolio = await this.repository.findOne({
      where: whereClause,
      relations: [
        'user',
        'asset',
        'asset.category',
        'asset.assetType',
        'platform',
        'savingsGoal',
      ],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }

    return portfolio;
  }

  async update(
    id: number,
    updatePortfolioDto: UpdatePortfolioDto,
    userId: number,
  ): Promise<Portfolio> {
    if (!updatePortfolioDto || Object.keys(updatePortfolioDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    // Verifica se o portfolio existe e pertence ao usuário
    const portfolio = await this.findOne(id, userId);

    // Verifica se a caixinha/objetivo existe e pertence ao usuário, se foi fornecida
    if (updatePortfolioDto.savingsGoalId) {
      await this.savingsGoalsService.findOne(
        updatePortfolioDto.savingsGoalId,
        userId,
      );
    }

    this.repository.merge(portfolio, updatePortfolioDto);
    const updatedPortfolio = await this.repository.save(portfolio);

    // Recalcular balance e preço médio após atualização
    return this.recalculatePortfolioBalance(updatedPortfolio.id);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se o portfolio existe e pertence ao usuário
    await this.findOne(id, userId);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }

  /**
   * Conta quantos portfolios estão usando um ativo específico
   */
  async countByAssetId(assetId: number, userId: number): Promise<number> {
    return this.repository.count({
      where: { assetId, userId },
    });
  }

  /**
   * Conta quantos portfólios estão usando uma plataforma específica
   * Nota: Não filtramos por usuário aqui, pois uma plataforma só pode ser usada por seu próprio dono
   */
  async countByPlatformId(platformId: number): Promise<number> {
    return this.repository.count({
      where: { platformId },
    });
  }

  /**
   * Conta quantos portfólios estão usando um objetivo de poupança específico
   * Nota: Não filtramos por usuário aqui, pois um objetivo só pode ser usado por seu próprio dono
   */
  async countBySavingsGoalId(savingsGoalId: number): Promise<number> {
    return this.repository.count({
      where: { savingsGoalId },
    });
  }

  /**
   * Recalcula o balance atual (quantidade) e preço médio de um portfolio baseado em suas transações
   */
  async recalculatePortfolioBalance(portfolioId: number): Promise<Portfolio> {
    const portfolio = await this.findOne(portfolioId);

    // Buscar todas as transações deste portfolio usando a TransactionsService
    const transactions =
      await this.transactionsService.findAllByPortfolioId(portfolioId);

    // Calcular quantidade atual (compras - vendas)
    const currentBalance = this.calculateTotalQuantity(transactions);

    // Calcular preço médio ponderado das compras
    const averagePrice = this.calculateAveragePrice(transactions);

    // Atualizar o portfolio
    portfolio.currentBalance = currentBalance;
    portfolio.averagePrice = averagePrice;

    return this.repository.save(portfolio);
  }

  /**
   * Calcula a quantidade total baseada nas transações (compras - vendas)
   * Tipos suportados:
   * - 1 = Compra (adiciona quantidade)
   * - 2 = Venda (subtrai quantidade)
   * - Outros IDs = Não afetam quantidade (ex: dividendos, rendimentos, etc.)
   */
  calculateTotalQuantity(transactions: Transaction[]): number {
    return transactions.reduce((total, transaction) => {
      let quantityMultiplier = 0;

      switch (transaction.transactionTypeId) {
        case 1: // Compra
          quantityMultiplier = 1;
          break;
        case 2: // Venda
          quantityMultiplier = -1;
          break;
        default:
          // Todos os outros tipos (dividendos, rendimentos, etc.) não afetam quantidade
          quantityMultiplier = 0;
          break;
      }

      return total + transaction.quantity * quantityMultiplier;
    }, 0);
  }

  /**
   * Calcula o preço médio ponderado das transações de compra
   */
  calculateAveragePrice(transactions: Transaction[]): number {
    // Filtrar apenas transações de compra (ID 1)
    const buyTransactions = transactions.filter(
      (t) => t.transactionTypeId === 1,
    );

    if (buyTransactions.length === 0) return 0;

    const totalQuantity = buyTransactions.reduce(
      (sum, t) => sum + t.quantity,
      0,
    );
    const weightedSum = buyTransactions.reduce(
      (sum, t) => sum + t.unitPrice * t.quantity,
      0,
    );

    return totalQuantity > 0 ? weightedSum / totalQuantity : 0;
  }
}
