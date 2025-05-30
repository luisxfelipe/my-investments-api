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

  /**
   * Atualiza um portfolio específico
   *
   * @param id ID do portfolio a ser atualizado
   * @param updatePortfolioDto Dados para atualização
   * @param userId ID do usuário para verificar permissão
   * @returns Portfolio atualizado com relações
   */
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

    // NOVA REGRA: Impedir remoção de meta de economia existente
    if (
      updatePortfolioDto.savingGoalId === null &&
      portfolio.savingGoalId !== null
    ) {
      throw new BadRequestException(
        `Removing a saving goal is not allowed. You can only change to another saving goal.`,
      );
    }

    // Criar um objeto compatível com a entidade para o merge
    const updateData: Partial<Portfolio> = {};

    // Processar savingGoalId se foi informado
    if (updatePortfolioDto.savingGoalId !== undefined) {
      // Verificar se é uma meta diferente da atual
      if (updatePortfolioDto.savingGoalId !== portfolio.savingGoalId) {
        // Verificar se a meta existe e pertence ao usuário
        if (updatePortfolioDto.savingGoalId !== null) {
          await this.savingsGoalsService.findOne(
            updatePortfolioDto.savingGoalId,
            userId,
          );
        }

        // Atualizar o savingGoalId
        updateData.savingGoalId = updatePortfolioDto.savingGoalId;
      }
    }

    // Se não há nada para atualizar, retornar o portfolio atual
    if (Object.keys(updateData).length === 0) {
      return portfolio;
    }

    // Merge e save
    this.repository.merge(portfolio, updateData);
    const updatedPortfolio = await this.repository.save(portfolio);

    // Explicita update no banco
    await this.repository.update(id, { savingGoalId: updateData.savingGoalId });

    // Para mudanças apenas de savingGoalId, recarregar para garantir que a relação esteja correta
    if (Object.keys(updateData).length === 1 && 'savingGoalId' in updateData) {
      // Buscar com todas as relações, incluindo a nova meta de economia
      const refreshedPortfolio = await this.repository.findOne({
        where: { id: updatedPortfolio.id },
        relations: [
          'asset',
          'asset.category',
          'asset.assetType',
          'platform',
          'savingGoal',
        ],
      });

      if (!refreshedPortfolio) {
        throw new NotFoundException(
          `Portfolio with ID ${updatedPortfolio.id} not found after update`,
        );
      }

      return refreshedPortfolio;
    }

    // Para outras atualizações, recalcular balance e preço médio
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
  async recalculatePortfolioBalance(
    portfolioId: number,
    existingPortfolio?: Portfolio,
  ): Promise<Portfolio> {
    if (!existingPortfolio) {
      // Buscar o portfolio diretamente do repositório para garantir dados atualizados
      const foundPortfolio = await this.repository.findOne({
        where: { id: portfolioId },
        relations: [
          'asset',
          'asset.category',
          'asset.assetType',
          'platform',
          'savingGoal',
        ],
      });

      if (!foundPortfolio) {
        throw new NotFoundException(
          `Portfolio with ID ${portfolioId} not found`,
        );
      }

      existingPortfolio = foundPortfolio;
    }

    // Buscar todas as transações deste portfolio usando a TransactionsService
    const transactions =
      await this.transactionsService.findAllByPortfolioId(portfolioId);

    // Calcular quantidade atual (compras - vendas)
    const currentBalance = this.calculateTotalQuantity(transactions);

    // Calcular preço médio ponderado das compras
    const averagePrice = this.calculateAveragePrice(transactions);

    // Preparar dados de atualização
    const updateData: Partial<Portfolio> = {
      currentBalance,
      averagePrice,
    };

    // Atualizar campos no banco de dados
    await this.repository.update(portfolioId, updateData);

    // Verificar se o portfolio existente tem todas as relações necessárias
    const hasAllRelations =
      existingPortfolio.asset &&
      existingPortfolio.asset.category &&
      existingPortfolio.asset.assetType &&
      existingPortfolio.platform;

    if (hasAllRelations) {
      // Portfolio já tem todas as relações, apenas atualizar valores calculados
      const finalPortfolio = {
        ...existingPortfolio,
        currentBalance,
        averagePrice,
      };

      // CORREÇÃO CRÍTICA: Verificar se a relação savingGoal está correta
      // mesmo quando o portfolio tem todas as relações
      if (existingPortfolio.savingGoal) {
        const currentSavingGoalId = existingPortfolio.savingGoal.id;
        if (existingPortfolio.savingGoalId !== currentSavingGoalId) {
          if (existingPortfolio.savingGoalId) {
            // Carregar a nova relação savingGoal
            const newSavingGoal = await this.savingsGoalsService.findOne(
              existingPortfolio.savingGoalId,
              existingPortfolio.userId,
            );
            finalPortfolio.savingGoal = newSavingGoal;
          } else {
            // Se savingGoalId é null, a relação também deve ser null
            finalPortfolio.savingGoal = null;
          }
        }
      } else if (existingPortfolio.savingGoalId) {
        // Se não há relação savingGoal mas deveria haver (savingGoalId não é null)
        const newSavingGoal = await this.savingsGoalsService.findOne(
          existingPortfolio.savingGoalId,
          existingPortfolio.userId,
        );
        finalPortfolio.savingGoal = newSavingGoal;
      }

      return finalPortfolio;
    } else {
      // Portfolio não tem todas as relações, buscar do banco mas preservar campos atualizados
      const portfolioWithRelations = await this.repository.findOne({
        where: { id: portfolioId },
        relations: [
          'asset',
          'asset.category',
          'asset.assetType',
          'platform',
          'savingGoal',
        ],
      });

      if (!portfolioWithRelations) {
        throw new NotFoundException(
          `Portfolio with ID ${portfolioId} not found after update`,
        );
      }

      // Criar portfolio final preservando TODOS os campos do existingPortfolio
      const finalPortfolio = {
        ...portfolioWithRelations, // Base com relações
        ...existingPortfolio, // Sobrescrever com valores atualizados
        currentBalance, // Aplicar valores calculados
        averagePrice,
      };

      // CORREÇÃO CRÍTICA: Se o savingGoalId foi alterado, a relação savingGoal
      // precisa ser atualizada também, pois ela ainda aponta para o valor antigo
      if (
        existingPortfolio.savingGoalId !== portfolioWithRelations.savingGoalId
      ) {
        if (existingPortfolio.savingGoalId) {
          // Carregar a nova relação savingGoal
          const newSavingGoal = await this.savingsGoalsService.findOne(
            existingPortfolio.savingGoalId,
            portfolioWithRelations.userId, // usar o userId do portfolio para validação
          );
          finalPortfolio.savingGoal = newSavingGoal;
        } else {
          // Se savingGoalId é null, a relação também deve ser null
          finalPortfolio.savingGoal = null;
        }
      }

      return finalPortfolio;
    }
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
