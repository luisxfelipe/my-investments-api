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
import { PlatformAssetResponseDto } from './dto/platform-asset-response.dto';
import { AssetTypeResponseDto } from 'src/asset-types/dto/asset-type-response.dto';
import { AssetType } from 'src/asset-types/entities/asset-type.entity';
import { TransactionsService } from 'src/transactions/transactions.service';
import { AssetsService } from 'src/assets/assets.service';
import { AssetQuotesService } from 'src/asset-quotes/asset-quotes.service';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { PortfoliosService } from 'src/portfolios/portfolios.service';

@Injectable()
export class PlatformsService {
  constructor(
    @InjectRepository(Platform)
    private readonly repository: Repository<Platform>,
    private readonly transactionsService: TransactionsService,
    private readonly assetsService: AssetsService,
    private readonly assetQuotesService: AssetQuotesService,
    @Inject(forwardRef(() => PortfoliosService))
    private readonly portfoliosService: PortfoliosService,
  ) {}

  async create(createPlatformDto: CreatePlatformDto): Promise<Platform> {
    // Verifica se já existe uma plataforma com o mesmo nome
    const existingPlatform = await this.findOneByName(createPlatformDto.name);

    if (existingPlatform) {
      throw new BadRequestException(
        `There is already a platform with the name '${createPlatformDto.name}'`,
      );
    }

    const platform = this.repository.create(createPlatformDto);
    return this.repository.save(platform);
  }

  async findAll(): Promise<Platform[]> {
    return this.repository.find();
  }

  async findAllWithPagination(
    take = 10,
    page = 1,
  ): Promise<PaginatedResponseDto<Platform>> {
    const skip = (page - 1) * take;

    const [platforms, total] = await this.repository.findAndCount({
      take,
      skip,
    });

    return new PaginatedResponseDto(platforms, total, take, page);
  }

  async findOne(id: number): Promise<Platform> {
    const platform = await this.repository.findOne({ where: { id } });

    if (!platform) {
      throw new NotFoundException(`Platform with ID ${id} not found`);
    }

    return platform;
  }

  async findOneByName(name: string): Promise<Platform | null> {
    return this.repository.findOne({ where: { name } });
  }

  async update(
    id: number,
    updatePlatformDto: UpdatePlatformDto,
  ): Promise<Platform> {
    if (!updatePlatformDto || Object.keys(updatePlatformDto).length === 0) {
      throw new BadRequestException(`No properties provided for update`);
    }

    const platform = await this.findOne(id);

    // Se estiver atualizando o nome, verifica se já existe outra plataforma com esse nome
    if (updatePlatformDto.name && updatePlatformDto.name !== platform.name) {
      const existingPlatform = await this.findOneByName(updatePlatformDto.name);

      if (existingPlatform && existingPlatform.id !== id) {
        throw new BadRequestException(
          `There is already a platform with the name '${updatePlatformDto.name}'`,
        );
      }
    }

    this.repository.merge(platform, updatePlatformDto);
    return this.repository.save(platform);
  }
  async remove(id: number): Promise<void> {
    // Verifica se a plataforma existe
    await this.findOne(id);

    // Usa softRemove em vez de remove para fazer soft delete
    await this.repository.softDelete(id);
  }

  /**
   * Busca apenas o dashboard/resumo de investimentos de uma plataforma
   */
  async getPlatformDashboard(
    platformId: number,
    userId: number,
  ): Promise<PlatformDashboardResponseDto> {
    // Verifica se a plataforma existe
    const platform = await this.findOne(platformId);

    // Buscar todas as transações da plataforma
    const transactions = await this.transactionsService.findAllByPlatformId(
      platformId,
      userId,
    );

    if (transactions.length === 0) {
      // Se não há transações, retornar dashboard vazio
      return new PlatformDashboardResponseDto(platform, 0, 0, 0, 0);
    }

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

    // Calcular métricas totais
    let totalAmountInvested = 0;
    let currentMarketValue = 0;
    let assetCount = 0;

    for (const [assetId, assetTransactionsList] of assetTransactions) {
      // Usar os métodos do PortfoliosService para calcular quantidade e preço médio
      const quantity = this.portfoliosService.calculateTotalQuantity(
        assetTransactionsList,
      );
      const averagePrice = this.portfoliosService.calculateAveragePrice(
        assetTransactionsList,
      );

      // Se quantidade for 0 ou negativa, pular ativo
      if (quantity <= 0) continue;

      // Buscar preço atual
      const currentQuote = quotesMap.get(assetId);
      const currentPrice = Number(currentQuote?.price || 0);

      // Calcular valores
      const investedValue = quantity * averagePrice;
      const currentValue = quantity * currentPrice;

      totalAmountInvested += investedValue;
      currentMarketValue += currentValue;
      assetCount++;
    }

    // Calcular rentabilidade total como porcentagem
    const totalReturnPercentage =
      totalAmountInvested > 0
        ? ((currentMarketValue - totalAmountInvested) / totalAmountInvested) *
          100
        : 0;

    return new PlatformDashboardResponseDto(
      platform,
      totalAmountInvested,
      currentMarketValue,
      totalReturnPercentage,
      assetCount,
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
    // Verifica se a plataforma existe
    await this.findOne(platformId);

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

    // Agrupar transações por ativo
    const assetTransactions = new Map<number, Transaction[]>();
    for (const transaction of transactions) {
      const assetId = transaction.portfolio.assetId;
      if (!assetTransactions.has(assetId)) {
        assetTransactions.set(assetId, []);
      }
      assetTransactions.get(assetId)!.push(transaction);
    }

    // Buscar informações dos ativos únicos
    const assetIds = Array.from(assetTransactions.keys());
    const assets = await this.assetsService.findByIds(assetIds);
    const assetMap = new Map(assets.map((asset) => [asset.id, asset]));

    // Buscar cotações atuais dos ativos
    const quotes =
      await this.assetQuotesService.findLatestForAssetIds(assetIds);

    const quotesMap = new Map(quotes.map((quote) => [quote.assetId, quote]));

    // Calcular métricas para cada ativo
    const assetResponses: PlatformAssetResponseDto[] = [];

    for (const [assetId, assetTransactionsList] of assetTransactions) {
      const asset = assetMap.get(assetId);
      if (!asset) continue;

      // Usar os métodos do PortfoliosService para calcular quantidade e preço médio
      const quantity = this.portfoliosService.calculateTotalQuantity(
        assetTransactionsList,
      );
      const averagePrice = this.portfoliosService.calculateAveragePrice(
        assetTransactionsList,
      );

      // Se quantidade for 0 ou negativa, pular ativo
      if (quantity <= 0) continue;

      // Buscar preço atual
      const currentQuote = quotesMap.get(assetId);
      const currentPrice = Number(currentQuote?.price || 0);

      // Calcular variação percentual
      const priceChangePercentage =
        currentPrice > 0
          ? ((currentPrice - averagePrice) / averagePrice) * 100
          : 0;

      // Calcular valor total atual
      const totalMarketValue = quantity * currentPrice;

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
        quantity: quantity,
        averagePurchasePrice: averagePrice,
        latestMarketPrice: currentPrice,
        priceChangePercentage: Number(priceChangePercentage.toFixed(2)),
        totalMarketValue: totalMarketValue,
      });

      assetResponses.push(assetResponse);
    }

    // Ordenar por valor total (maior para menor)
    assetResponses.sort((a, b) => b.totalMarketValue - a.totalMarketValue);

    // Aplicar paginação
    const skip = (page - 1) * take;
    const paginatedAssets = assetResponses.slice(skip, skip + take);
    const total = assetResponses.length;

    // Criar resposta paginada
    const totalPages = Math.ceil(total / take);
    const meta = new PaginationMetaDto(take, total, page, totalPages);

    return new PaginatedPlatformAssetsResponseDto(meta, paginatedAssets);
  }
}
