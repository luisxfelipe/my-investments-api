import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetQuote } from './entities/asset-quote.entity';
import { CreateAssetQuoteDto } from './dto/create-asset-quote.dto';
import { UpdateAssetQuoteDto } from './dto/update-asset-quote.dto';
import { PaginatedResponseDto } from 'src/dtos/paginated-response.dto';
import { AssetsService } from 'src/assets/assets.service';

@Injectable()
export class AssetQuotesService {
  constructor(
    @InjectRepository(AssetQuote)
    private readonly repository: Repository<AssetQuote>,
    @Inject(forwardRef(() => AssetsService))
    private readonly assetsService: AssetsService,
  ) {}

  async create(
    createAssetQuoteDto: CreateAssetQuoteDto,
    userId: number,
  ): Promise<AssetQuote> {
    // Validação 11.3: Verifica se o asset existe e pertence ao usuário
    await this.assetsService.findOne(createAssetQuoteDto.assetId, userId);

    // Validação 11.4: Business Rules
    this.validateBusinessRules(createAssetQuoteDto);

    // Cria uma nova cotação
    const assetQuote = this.repository.create({
      ...createAssetQuoteDto,
      timestamp: createAssetQuoteDto.timestamp || new Date(),
    });
    return this.repository.save(assetQuote);
  }

  async findOne(id: number, userId?: number): Promise<AssetQuote> {
    if (userId) {
      // Validação 11.1: Filtrar por usuário
      const quote = await this.repository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.asset', 'asset')
        .leftJoinAndSelect('asset.category', 'category')
        .leftJoinAndSelect('asset.assetType', 'assetType')
        .where('quote.id = :id', { id })
        .andWhere('asset.userId = :userId', { userId })
        .getOne();

      if (!quote) {
        throw new NotFoundException('Asset quote not found or access denied');
      }
      return quote;
    } else {
      // Método original para compatibilidade
      const quote = await this.repository.findOne({
        where: { id },
        relations: ['asset'],
      });
      if (!quote) {
        throw new NotFoundException(`Quote with ID ${id} not found`);
      }
      return quote;
    }
  }

  async findLatestByAssetId(
    assetId: number,
    userId?: number,
  ): Promise<AssetQuote> {
    if (userId) {
      // Validação 11.1: Verificar se asset pertence ao usuário
      await this.assetsService.findOne(assetId, userId);
    }

    const quote = await this.repository.findOne({
      where: { assetId },
      order: { timestamp: 'DESC' },
      relations: ['asset'],
    });
    if (!quote) {
      throw new NotFoundException('Quote not found for the asset provided.');
    }
    return quote;
  }

  /**
   * Retorna a cotação mais recente de cada ativo.
   * Útil para exibir o valor atual de todos os ativos em uma única consulta.
   */
  async findLatestForAllAssets(userId?: number): Promise<AssetQuote[]> {
    if (userId) {
      // Filtrar apenas assets do usuário
      return this.repository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.asset', 'asset')
        .leftJoinAndSelect('asset.category', 'category')
        .leftJoinAndSelect('asset.assetType', 'assetType')
        .where('asset.userId = :userId', { userId })
        .orderBy('quote.timestamp', 'DESC')
        .getMany();
    } else {
      // Método original
      return this.repository
        .createQueryBuilder('quote')
        .leftJoinAndSelect('quote.asset', 'asset')
        .distinctOn(['asset.id'])
        .orderBy('asset.id')
        .addOrderBy('quote.timestamp', 'DESC')
        .getMany();
    }
  }

  /**
   * Retorna a cotação mais recente de cada ativo, de forma paginada.
   * Útil para exibir o valor atual de todos os ativos em uma única consulta paginada.
   */
  async findLatestForAllAssetsWithPagination(
    take = 10,
    page = 1,
    userId?: number,
  ): Promise<PaginatedResponseDto<AssetQuote>> {
    const skip = (page - 1) * take;

    if (userId) {
      // Filtrar apenas assets do usuário
      const subQuery = this.repository
        .createQueryBuilder('sub')
        .leftJoin('sub.asset', 'asset')
        .select('MAX(sub.timestamp)', 'maxTimestamp')
        .addSelect('sub.assetId', 'assetId')
        .where('asset.userId = :userId', { userId })
        .groupBy('sub.assetId');

      const [quotes, total] = await this.repository
        .createQueryBuilder('quote')
        .innerJoin(
          '(' + subQuery.getQuery() + ')',
          'sq',
          'quote.assetId = sq.assetId AND quote.timestamp = sq.maxTimestamp',
        )
        .leftJoinAndSelect('quote.asset', 'asset')
        .leftJoinAndSelect('asset.category', 'category')
        .leftJoinAndSelect('asset.assetType', 'assetType')
        .where('asset.userId = :userId', { userId })
        .orderBy('quote.assetId', 'ASC')
        .setParameters(subQuery.getParameters())
        .take(take)
        .skip(skip)
        .getManyAndCount();

      return new PaginatedResponseDto(quotes, total, take, page);
    } else {
      // Método original para compatibilidade
      const subQuery = this.repository
        .createQueryBuilder('sub')
        .select('MAX(sub.timestamp)', 'maxTimestamp')
        .addSelect('sub.assetId', 'assetId')
        .groupBy('sub.assetId');

      // Consulta principal com paginação
      const [quotes, total] = await this.repository
        .createQueryBuilder('quote')
        .innerJoin(
          '(' + subQuery.getQuery() + ')',
          'sq',
          'quote.assetId = sq.assetId AND quote.timestamp = sq.maxTimestamp',
        )
        .orderBy('quote.assetId', 'ASC')
        .take(take)
        .skip(skip)
        .getManyAndCount();

      return new PaginatedResponseDto(quotes, total, take, page);
    }
  }

  async findAllByAssetId(
    assetId: number,
    userId?: number,
  ): Promise<AssetQuote[]> {
    if (userId) {
      // Validação 11.1: Verificar se asset pertence ao usuário
      await this.assetsService.findOne(assetId, userId);
    }

    return this.repository.find({
      where: { assetId },
      order: { timestamp: 'DESC' },
      relations: ['asset'],
    });
  }

  async findLatestForAssetIds(assetIds: number[]): Promise<AssetQuote[]> {
    if (!assetIds || assetIds.length === 0) {
      return [];
    }
    // Subquery para pegar a última cotação (maior timestamp) de cada assetId informado
    const subQuery = this.repository
      .createQueryBuilder('sub')
      .select('MAX(sub.timestamp)', 'maxTimestamp')
      .addSelect('sub.assetId', 'assetId')
      .where('sub.assetId IN (:...assetIds)', { assetIds })
      .groupBy('sub.assetId');

    // Junta com a tabela principal para pegar os registros completos
    const latestQuotes = await this.repository
      .createQueryBuilder('quote')
      .innerJoin(
        '(' + subQuery.getQuery() + ')',
        'sq',
        'quote.assetId = sq.assetId AND quote.timestamp = sq.maxTimestamp',
      )
      .setParameters(subQuery.getParameters())
      .getMany();

    return latestQuotes;
  }

  async update(
    id: number,
    updateAssetQuoteDto: UpdateAssetQuoteDto,
    userId?: number,
  ): Promise<AssetQuote> {
    if (!updateAssetQuoteDto || Object.keys(updateAssetQuoteDto).length === 0) {
      throw new BadRequestException('No properties provided for update');
    }

    // Buscar e validar propriedade
    const quote = await this.findOne(id, userId);

    // Validar business rules se price foi alterado
    if (updateAssetQuoteDto.price !== undefined) {
      if (updateAssetQuoteDto.price <= 0) {
        throw new BadRequestException('Price must be positive');
      }
    }

    this.repository.merge(quote, updateAssetQuoteDto);
    return this.repository.save(quote);
  }

  async delete(id: number, userId?: number): Promise<void> {
    // Verificar se existe e pertence ao usuário
    await this.findOne(id, userId);

    // Soft delete
    await this.repository.softDelete(id);
  }

  /**
   * Conta quantas cotações existem para um ativo específico
   */
  async countByAssetId(assetId: number): Promise<number> {
    return this.repository.count({
      where: { assetId },
    });
  }

  /**
   * Validação 11.4: Business Rules para Asset Quotes
   */
  private validateBusinessRules(dto: CreateAssetQuoteDto): void {
    // Validar se timestamp não é futuro
    const timestamp = dto.timestamp || new Date();
    const now = new Date();
    if (timestamp > now) {
      throw new BadRequestException('Quote timestamp cannot be in the future');
    }

    // Opcional: Validar se timestamp não é muito antigo (mais de 10 anos)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(now.getFullYear() - 10);
    if (timestamp < tenYearsAgo) {
      throw new BadRequestException(
        'Quote timestamp cannot be older than 10 years',
      );
    }

    // Validar se o preço é positivo (validação adicional)
    if (dto.price <= 0) {
      throw new BadRequestException('Price must be positive');
    }
  }
}
