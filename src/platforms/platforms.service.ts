import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Platform } from './entities/platform.entity';
import { Repository } from 'typeorm';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import { PaginationMetaDto } from 'src/dtos/pagination.dto';
import { PaginatedPlatformAssetsResponseDto } from './dto/paginated-platform-assets-response.dto';
import { PlatformDashboardResponseDto } from './dto/platform-dashboard-response.dto';
import { PaginatedPlatformDashboardResponseDto } from './dto/paginated-platform-dashboard-response.dto';
import { PlatformAssetResponseDto } from './dto/platform-asset-response.dto';
import { AssetTypeResponseDto } from 'src/asset-types/dto/asset-type-response.dto';
import { AssetType } from 'src/asset-types/entities/asset-type.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { AssetsService } from 'src/assets/assets.service';
import { AssetQuotesService } from 'src/asset-quotes/asset-quotes.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { PortfoliosService } from 'src/portfolios/portfolios.service';
import {
  PortfolioCalculationsService,
  AssetMetrics,
} from 'src/portfolios/portfolio-calculations.service';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(Platform)
    private readonly repository: Repository<Platform>,
    @Inject(forwardRef(() => TransactionsService))
    private readonly transactionsService: TransactionsService,
    @Inject(forwardRef(() => AssetsService))
    private readonly assetsService: AssetsService,
    @Inject(forwardRef(() => AssetQuotesService))
    private readonly assetQuotesService: AssetQuotesService,
    @Inject(forwardRef(() => PortfoliosService))
    private readonly portfoliosService: PortfoliosService,
    @Inject(forwardRef(() => PortfolioCalculationsService))
    private readonly portfolioCalculationsService: PortfolioCalculationsService,
  ) {}

  async create(
    createPlatformDto: CreatePlatformDto,
    userId: number,
  ): Promise<Platform> {
    // Verifica se já existe uma plataforma com o mesmo nome para este usuário
    const existingPlatform = await this.findOneByName(
      createPlatformDto.name,
      userId,
    );

    if (existingPlatform) {
      throw new BadRequestException(
        `There is already a platform with the name '${createPlatformDto.name}' for this user`,
      );
    }

    const platform = this.repository.create({
      ...createPlatformDto,
      userId,
    });
    return this.repository.save(platform);
  }

  async findAll(userId: number): Promise<Platform[]> {
    return this.repository.find({
      where: { userId },
      order: { name: 'ASC' },
    });
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
    userId: number,
  ): Promise<PaginatedResponseDto<Platform>> {
    const skip = (page - 1) * take;

    const [platforms, total] = await this.repository.findAndCount({
      where: { userId },
      take,
      skip,
      order: { name: 'ASC' },
    });

    return new PaginatedResponseDto(platforms, total, take, page);
  }

  async findOne(id: number, userId: number): Promise<Platform> {
    const platform = await this.repository.findOne({
      where: { id, userId },
    });

    if (!platform) {
      throw new NotFoundException(
        `Platform with ID ${id} not found for this user`,
      );
    }

    return platform;
  }

  // Método para compatibilidade com outros serviços que só precisam verificar se a plataforma existe
  async findOneById(id: number): Promise<Platform> {
    const platform = await this.repository.findOne({
      where: { id },
    });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    return platform;
  }

  async findOneByName(name: string, userId: number): Promise<Platform | null> {
    return this.repository.findOne({
      where: { name, userId },
    });
  }

  async update(
    id: number,
    updatePlatformDto: UpdatePlatformDto,
    userId: number,
  ): Promise<Platform> {
    if (!updatePlatformDto || Object.keys(updatePlatformDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    const platform = await this.findOne(id, userId);

    // Se estiver atualizando o nome, verifica se já existe outra plataforma com esse nome para este usuário
    if (updatePlatformDto.name && updatePlatformDto.name !== platform.name) {
      const existingPlatform = await this.findOneByName(
        updatePlatformDto.name,
        userId,
      );

      if (existingPlatform && existingPlatform.id !== id) {
        throw new BadRequestException(
          `There is already a platform with the name '${updatePlatformDto.name}' for this user`,
        );
      }
    }

    this.repository.merge(platform, updatePlatformDto);
    return this.repository.save(platform);
  }
  async remove(id: number, userId: number): Promise<void> {
    // Verifica se a plataforma existe para este usuário
    await this.findOne(id, userId);

    // Verifica se existem portfólios associados a esta plataforma
    const portfolioCount = await this.portfoliosService.countByPlatformId(id);
    if (portfolioCount > 0) {
      throw new BadRequestException(
        `Cannot remove platform with ID ${id} because it has ${portfolioCount} associated portfolios`,
      );
    }

    // Usa softRemove em vez de remove para fazer soft delete
    await this.repository.softDelete({ id, userId });
  }

  /**
   * Busca apenas o dashboard/resumo de investimentos de uma plataforma
   */
  async getPlatformDashboard(
    platformId: number,
    userId: number,
  ): Promise<PlatformDashboardResponseDto> {
    // Verifica se a plataforma existe para este usuário
    const platform = await this.findOne(platformId, userId);

    // Buscar todas as transações da plataforma
    const transactions = await this.transactionsService.findAllByPlatformId(
      platformId,
      userId,
    );

    if (transactions.length === 0) {
      // Se não há transações, retornar dashboard vazio
      return new PlatformDashboardResponseDto(platform, 0, 0, 0, 0);
    }

    // ✅ USAR método auxiliar otimizado que calcula apenas o que é necessário
    const assetMetrics =
      await this.extractAssetMetricsFromTransactions(transactions);
    const platformSummary = this.calculateBasicPlatformSummary(assetMetrics);

    return new PlatformDashboardResponseDto(
      platform,
      platformSummary.totalInvested,
      platformSummary.totalCurrentValue,
      platformSummary.totalRealizedGainLoss,
      platformSummary.totalAssets,
    );
  }

  /**
   * Busca apenas a lista paginada de ativos de uma plataforma
   */
  async getPlatformAssets(
    platformId: number,
    userId: number,
    take = 10,
    page = 1,
  ): Promise<PaginatedPlatformAssetsResponseDto> {
    // Verifica se a plataforma existe para este usuário
    await this.findOne(platformId, userId);

    // Buscar todas as transações da plataforma
    const transactions = await this.transactionsService.findAllByPlatformId(
      platformId,
      userId,
    );

    if (transactions.length === 0) {
      // Se não há transações, retornar lista vazia
      const meta = new PaginationMetaDto(take, 0, page, 0);
      return new PaginatedPlatformAssetsResponseDto(meta, []);
    }

    // Usar método auxiliar para calcular métricas dos ativos usando PortfolioCalculationsService
    const assetResponses = await this.calculateAssetMetricsForPlatform(
      transactions,
      userId,
    );

    // Aplicar paginação
    const skip = (page - 1) * take;
    const paginatedAssets = assetResponses.slice(skip, skip + take);
    const total = assetResponses.length;

    // Criar resposta paginada
    const totalPages = Math.ceil(total / take);
    const meta = new PaginationMetaDto(take, total, page, totalPages);

    return new PaginatedPlatformAssetsResponseDto(meta, paginatedAssets);
  }

  /**
   * Busca todas as plataformas com dados de dashboard e paginação
   */
  async findAllDashboardsWithPagination(
    take = 10,
    page = 1,
    userId: number,
  ): Promise<PaginatedPlatformDashboardResponseDto> {
    // Primeiro buscar as plataformas com paginação
    const paginatedPlatforms = await this.findAllWithPagination(
      take,
      page,
      userId,
    );

    // Para cada plataforma, calcular o dashboard
    const dashboards: PlatformDashboardResponseDto[] = [];

    for (const platform of paginatedPlatforms.data) {
      const dashboard = await this.getPlatformDashboard(platform.id, userId);
      dashboards.push(dashboard);
    }

    return new PaginatedPlatformDashboardResponseDto(
      dashboards,
      paginatedPlatforms.meta.totalItems,
      paginatedPlatforms.meta.itemsPerPage,
      paginatedPlatforms.meta.currentPage,
    );
  }

  /**
   * ✅ MÉTODO AUXILIAR: Extrai métricas de ativos de transações
   * Centraliza a lógica de agrupamento e cálculo de métricas de ativos
   * Reutilizado por calculateAssetMetricsForPlatform e getPlatformDashboard
   *
   * @param transactions Lista de transações
   * @returns Array de métricas de ativos calculadas
   */
  private async extractAssetMetricsFromTransactions(
    transactions: Transaction[],
  ): Promise<AssetMetrics[]> {
    // Agrupar transações por ativo
    const assetTransactions = new Map<number, Transaction[]>();
    for (const transaction of transactions) {
      const assetId = transaction.portfolio.assetId;
      if (!assetTransactions.has(assetId)) {
        assetTransactions.set(assetId, []);
      }
      assetTransactions.get(assetId)!.push(transaction);
    }

    // Buscar cotações atuais dos ativos
    const assetIds = Array.from(assetTransactions.keys());
    const quotes =
      await this.assetQuotesService.findLatestForAssetIds(assetIds);
    const quotesMap = new Map(quotes.map((quote) => [quote.assetId, quote]));

    const assetMetrics: AssetMetrics[] = [];

    // Calcular métricas para cada ativo usando PortfolioCalculationsService
    for (const [assetId, assetTransactionsList] of assetTransactions) {
      // Ordenar transações por data para cálculo correto
      const sortedTransactions = assetTransactionsList.sort((a, b) => {
        return (
          new Date(a.transactionDate).getTime() -
          new Date(b.transactionDate).getTime()
        );
      });

      // Buscar preço atual
      const currentQuote = quotesMap.get(assetId);
      const currentPrice = currentQuote
        ? Number(currentQuote.price)
        : undefined;

      // ✅ USAR PortfolioCalculationsService para calcular métricas
      const metrics = this.portfolioCalculationsService.calculateAssetMetrics(
        sortedTransactions,
        currentPrice,
      );

      // Apenas incluir ativos com saldo positivo
      if (metrics.quantity > 0) {
        assetMetrics.push(metrics);
      }
    }

    return assetMetrics;
  }

  /**
   * ✅ REFATORADO: Método auxiliar para calcular métricas de ativos individuais
   * Agora usa extractAssetMetricsFromTransactions() para eliminar duplicação
   *
   * @param transactions Lista de transações da plataforma
   * @param userId ID do usuário
   * @returns Lista de métricas de ativos
   */
  private async calculateAssetMetricsForPlatform(
    transactions: Transaction[],
    userId: number,
  ): Promise<PlatformAssetResponseDto[]> {
    // ✅ USAR método auxiliar para extrair métricas de ativos
    const assetMetrics =
      await this.extractAssetMetricsFromTransactions(transactions);

    // Buscar informações dos ativos únicos
    const assetIds = assetMetrics.map((metric) => metric.assetId);
    const assets = await this.assetsService.findByIds(assetIds, userId);
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

    const assetResponses: PlatformAssetResponseDto[] = [];

    // Transformar métricas em responses de ativos
    for (const metrics of assetMetrics) {
      const asset = assetMap.get(metrics.assetId);
      if (!asset) continue;

      // Calcular variação percentual
      const priceChangePercentage =
        metrics.currentPrice && metrics.averagePrice > 0
          ? ((metrics.currentPrice - metrics.averagePrice) /
              metrics.averagePrice) *
            100
          : 0;

      // Criar response do ativo
      let typeResponse: AssetTypeResponseDto;
      if (asset.assetType) {
        typeResponse = new AssetTypeResponseDto(asset.assetType);
      } else {
        // Criar um AssetType temporário para o fallback
        const unknownAssetType = new AssetType({ id: 0, name: 'Unknown' });
        typeResponse = new AssetTypeResponseDto(unknownAssetType);
      }

      const assetResponse = new PlatformAssetResponseDto({
        code: asset.code,
        type: typeResponse,
        currentBalance: metrics.quantity,
        averagePurchasePrice: metrics.averagePrice,
        latestMarketPrice: metrics.currentPrice || 0,
        priceChangePercentage: Number(priceChangePercentage.toFixed(2)),
        totalMarketValue: metrics.currentValue,
      });

      assetResponses.push(assetResponse);
    }

    // Ordenar por valor total (maior para menor)
    assetResponses.sort((a, b) => b.totalMarketValue - a.totalMarketValue);

    return assetResponses;
  }

  /**
   * ✅ MÉTODO AUXILIAR OTIMIZADO: Calcula apenas as métricas básicas necessárias para o dashboard
   * Evita calcular propriedades não utilizadas (totalUnrealizedGainLoss, totalUnrealizedPercentage, assetsMetrics)
   *
   * @param assetMetrics Array de métricas individuais de ativos
   * @returns Resumo básico da plataforma (apenas propriedades usadas)
   */
  private calculateBasicPlatformSummary(assetMetrics: AssetMetrics[]): {
    totalAssets: number;
    totalInvested: number;
    totalCurrentValue: number;
    totalRealizedGainLoss: number;
  } {
    return assetMetrics.reduce(
      (acc, asset) => ({
        totalAssets: acc.totalAssets + 1,
        totalInvested: acc.totalInvested + asset.totalInvested,
        totalCurrentValue: acc.totalCurrentValue + asset.currentValue,
        totalRealizedGainLoss:
          acc.totalRealizedGainLoss + asset.realizedGainLoss,
      }),
      {
        totalAssets: 0,
        totalInvested: 0,
        totalCurrentValue: 0,
        totalRealizedGainLoss: 0,
      },
    );
  }
}
