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
import { Repository, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionsService } from 'src/transactions/transactions.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { PaginatedResponseDto } from '../dtos/paginated-response.dto';

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
    if (createPortfolioDto.savingGoalId) {
      await this.savingsGoalsService.findOne(
        createPortfolioDto.savingGoalId,
        userId,
      );
    }

    // VALIDAÇÃO MODELO "CAIXINHAS":
    // Verifica se já existe portfolio com a mesma combinação exata
    // (incluindo savingGoalId - mesmo que seja null)
    const existingPortfolio = createPortfolioDto.savingGoalId
      ? await this.repository.findOne({
          where: {
            userId,
            assetId: createPortfolioDto.assetId,
            platformId: createPortfolioDto.platformId,
            savingGoalId: createPortfolioDto.savingGoalId,
          },
        })
      : await this.repository.findOne({
          where: {
            userId,
            assetId: createPortfolioDto.assetId,
            platformId: createPortfolioDto.platformId,
            savingGoalId: IsNull(),
          },
        });

    if (existingPortfolio) {
      if (createPortfolioDto.savingGoalId) {
        throw new BadRequestException(
          `Portfolio already exists for this asset and platform with the same savings goal`,
        );
      } else {
        throw new BadRequestException(
          `Portfolio already exists for this asset and platform without savings goal`,
        );
      }
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
        'asset',
        'asset.category',
        'asset.assetType',
        'platform',
        'savingGoal',
      ],
    });
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
    userId: number,
  ): Promise<PaginatedResponseDto<Portfolio>> {
    const skip = (page - 1) * take;

    const [portfolios, total] = await this.repository.findAndCount({
      where: { userId },
      take,
      skip,
      relations: [
        'asset',
        'asset.category',
        'asset.assetType',
        'platform',
        'savingGoal',
      ],
      order: { createdAt: 'DESC' },
    });

    return new PaginatedResponseDto(portfolios, total, take, page);
  }

  /**
   * Busca um portfolio específico com estratégia inteligente para valores de saldo e preço médio
   * @param id ID do portfolio a ser buscado
   * @param userId ID opcional do usuário para verificar acesso
   * @param forceAccurateCalculation força o recálculo preciso (para operações financeiras críticas)
   */
  async findOne(
    id: number,
    userId?: number,
    forceAccurateCalculation: boolean = false,
  ): Promise<Portfolio> {
    const whereClause: { id: number; userId?: number } = { id };
    if (userId) {
      whereClause.userId = userId;
    }

    const portfolio = await this.repository.findOne({
      where: whereClause,
      relations: [
        'asset',
        'asset.category',
        'asset.assetType',
        'platform',
        'savingGoal',
      ],
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${id} not found`);
    }

    // Para operações críticas, usar cálculo preciso
    if (forceAccurateCalculation) {
      // Recalcular saldo e preço médio com precisão
      const accurateBalance = await this.getCurrentBalanceAccurate(id);
      const accurateAveragePrice = await this.getAveragePriceAccurate(id);

      // Criar cópia para não modificar a entidade persistida
      return {
        ...portfolio,
        currentBalance: accurateBalance,
        averagePrice: accurateAveragePrice,
      };
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
    if (updatePortfolioDto.savingGoalId) {
      await this.savingsGoalsService.findOne(
        updatePortfolioDto.savingGoalId,
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
  async countBySavingGoalId(savingGoalId: number): Promise<number> {
    return this.repository.count({
      where: { savingGoalId },
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

  /**
   * Verifica se há saldo suficiente usando o campo currentBalance (cache)
   * ⚠️  ATENÇÃO: Use apenas para consultas rápidas, NÃO para validações de venda!
   * Para vendas, sempre use validateSaleTransaction()
   */
  async hasSufficientBalance(
    portfolioId: number,
    requiredAmount: number,
  ): Promise<boolean> {
    const portfolio = await this.repository.findOne({
      where: { id: portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    return portfolio.currentBalance >= requiredAmount;
  }

  /**
   * Obtém o saldo atual usando cache (currentBalance)
   * ⚠️  ATENÇÃO: Use apenas para dashboards/listagens, NÃO para validações críticas!
   * Para operações financeiras, sempre use getCurrentBalanceAccurate()
   */
  async getCurrentBalanceFast(portfolioId: number): Promise<number> {
    const portfolio = await this.repository.findOne({
      where: { id: portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    return portfolio.currentBalance;
  }

  /**
   * Obtém o saldo atual com recálculo preciso
   * Para validações críticas onde precisão é essencial
   */
  async getCurrentBalanceAccurate(portfolioId: number): Promise<number> {
    const portfolio = await this.recalculatePortfolioBalance(portfolioId);
    return portfolio.currentBalance;
  }

  /**
   * Validação segura para vendas: sempre recalcula para máxima precisão
   * Prioriza segurança sobre performance em operações críticas
   */
  async validateSaleTransaction(
    portfolioId: number,
    saleAmount: number,
    userId?: number,
  ): Promise<void> {
    // Verificar se o portfolio existe e pertence ao usuário (se userId fornecido)
    if (userId) {
      await this.findOne(portfolioId, userId);
    }

    // Para vendas, SEMPRE recalcular - precisão é crítica
    const portfolio = await this.recalculatePortfolioBalance(portfolioId);

    if (portfolio.currentBalance < saleAmount) {
      throw new BadRequestException(
        `Insufficient balance for sale. Available: ${portfolio.currentBalance}, Required: ${saleAmount}`,
      );
    }
  }

  /**
   * Obtém o preço médio usando cache (averagePrice)
   * ⚠️  ATENÇÃO: Use apenas para dashboards/listagens, NÃO para operações críticas!
   * Para relatórios financeiros e vendas, sempre use getAveragePriceAccurate()
   */
  async getAveragePriceFast(portfolioId: number): Promise<number> {
    const portfolio = await this.repository.findOne({
      where: { id: portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    return portfolio.averagePrice;
  }

  /**
   * Obtém o preço médio com recálculo preciso
   * Para relatórios financeiros e outras operações onde precisão é essencial
   */
  async getAveragePriceAccurate(portfolioId: number): Promise<number> {
    // Buscar todas as transações e recalcular
    const transactions =
      await this.transactionsService.findAllByPortfolioId(portfolioId);
    return this.calculateAveragePrice(transactions);
  }

  /**
   * Recalcula apenas o preço médio e atualiza o portfolio
   * Útil quando só precisamos atualizar o preço médio sem afetar o saldo
   */
  async recalculateAveragePrice(portfolioId: number): Promise<void> {
    const portfolio = await this.repository.findOne({
      where: { id: portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(`Portfolio with ID ${portfolioId} not found`);
    }

    // Buscar todas as transações e recalcular
    const transactions =
      await this.transactionsService.findAllByPortfolioId(portfolioId);
    const averagePrice = this.calculateAveragePrice(transactions);

    // Atualizar apenas o preço médio
    await this.repository.update(portfolioId, { averagePrice });
  }
}
