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
import { PortfolioCalculationsService } from './portfolio-calculations.service';
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
    private readonly portfolioCalculationsService: PortfolioCalculationsService,
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
    });
    const savedPortfolio = await this.repository.save(portfolio);

    return this.findOne(savedPortfolio.id);
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

  // Busca todos os portfolios de uma plataforma específica com paginação
  async findByPlatformWithPagination(
    platformId: number,
    take = 10,
    page = 1,
    userId: number,
  ): Promise<PaginatedResponseDto<Portfolio>> {
    // Verificar se a plataforma existe e pertence ao usuário
    await this.platformsService.findOne(platformId, userId);

    const skip = (page - 1) * take;

    const [portfolios, total] = await this.repository.findAndCount({
      where: {
        userId,
        platformId,
      },
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
   * Busca um portfolio específico
   * @param id ID do portfolio a ser buscado
   * @param userId ID opcional do usuário para verificar acesso
   */
  async findOne(id: number, userId?: number): Promise<Portfolio> {
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

    return portfolio;
  }

  // Atualiza um portfolio específico
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

    // Para outras atualizações, retornar o portfolio atualizado
    return this.findOne(updatedPortfolio.id, userId);
  }

  async remove(id: number, userId: number): Promise<void> {
    // Verifica se o portfolio existe e pertence ao usuário
    await this.findOne(id, userId);

    // Usa softDelete em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }

  // Conta quantos portfolios estão usando um ativo específico
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
   * Remove a meta de economia de um portfolio específico
   * Este endpoint existe especificamente para remover metas de economia,
   * já que o endpoint de update não permite essa operação
   */
  async removeSavingGoal(id: number, userId: number): Promise<Portfolio> {
    // Verificar se o portfolio existe e pertence ao usuário
    const portfolio = await this.findOne(id, userId);

    // Verificar se o portfolio tem uma meta de economia
    if (portfolio.savingGoalId === null) {
      throw new BadRequestException(
        `Portfolio with ID ${id} doesn't have a saving goal to remove`,
      );
    }

    // Remover a associação com a meta de economia
    portfolio.savingGoalId = null;
    portfolio.savingGoal = null;

    // Salvar alterações
    await this.repository.save(portfolio);

    // Buscar portfolio atualizado com relações
    const updatedPortfolio = await this.repository.findOne({
      where: { id, userId },
      relations: [
        'asset',
        'asset.category',
        'asset.assetType',
        'platform',
        'savingGoal', // Isso será null agora
      ],
    });

    if (!updatedPortfolio) {
      throw new NotFoundException(
        `Portfolio with ID ${id} not found after removing saving goal`,
      );
    }

    return updatedPortfolio;
  }
}
